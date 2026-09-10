/**
 * Small HTTP wrapper around the ingestion/retrieval graphs for the Daksha
 * app: accepts an uploaded PDF and ingests it into the local Chroma vector
 * store, and answers chat questions scoped to a case/document.
 *
 * This talks to the compiled graphs directly (in-process) rather than going
 * through the `langgraph dev` server, which stays available separately for
 * LangGraph Studio debugging.
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pdfParse from 'pdf-parse';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

import { graph as ingestionGraph } from './ingestion_graph/graph.js';
import { makeRetriever } from './shared/retrieval.js';
import { loadChatModel } from './shared/utils.js';
import { formatDocs } from './retrieval_graph/utils.js';
import { RESPONSE_SYSTEM_PROMPT } from './retrieval_graph/prompts.js';

const app = express();
const PORT = process.env.APP_SERVER_PORT || 2100;

app.use(
  cors({
    origin: (process.env.CORS_ALLOWED_ORIGINS || 'http://localhost:3000').split(
      ',',
    ),
  }),
);
app.use(express.json());

const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
});

function baseConfigurable(caseId?: string, documentId?: string) {
  return {
    retrieverProvider: 'chroma' as const,
    k: 2,
    filterKwargs: {
      ...(caseId ? { case: String(caseId) } : {}),
      ...(documentId ? { document: String(documentId) } : {}),
    },
  };
}

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/ingest', upload.single('file'), async (req, res) => {
  try {
    const file = req.file;
    const { case: caseId, document: documentId, title } = req.body as Record<
      string,
      string
    >;

    if (!file) {
      return res.status(400).json({ error: 'file is required' });
    }
    if (!caseId || !documentId) {
      return res.status(400).json({ error: 'case and document are required' });
    }

    const parsed = await pdfParse(file.buffer);
    const text = parsed.text?.trim();
    if (!text) {
      return res.status(422).json({ error: 'Could not extract text from PDF' });
    }

    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 60,
    });
    const chunks = await splitter.splitText(text);

    const docs = chunks.map((chunk) => ({
      pageContent: chunk,
      metadata: {
        case: String(caseId),
        document: String(documentId),
        title: title || file.originalname,
      },
    }));

    await ingestionGraph.invoke(
      { docs },
      { configurable: baseConfigurable() },
    );

    res.json({ status: 'ingested', chunks: docs.length });
  } catch (err) {
    console.error('ingest error', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/chat', async (req, res) => {
  try {
    const { query, case: caseId, document: documentId } = req.body as {
      query?: string;
      case?: string;
      document?: string;
    };

    if (!query || !query.trim()) {
      return res.status(400).json({ error: 'query is required' });
    }
    if (!caseId) {
      return res.status(400).json({ error: 'case is required' });
    }

    // Skip the graph's "retrieve vs. answer directly" routing LLM call: this
    // endpoint is always a document-grounded chat, so always retrieve. That
    // cuts one full model round-trip off every request, which matters a lot
    // on slow local inference.
    const configuration = baseConfigurable(caseId, documentId);
    const retriever = await makeRetriever({ configurable: configuration });
    const documents = await retriever.invoke(query);

    const model = await loadChatModel('local/qwen2.5-1.5b-instruct');
    const context = formatDocs(documents);
    const formattedPrompt = await RESPONSE_SYSTEM_PROMPT.invoke({
      question: query,
      context,
    });
    const response = await model.invoke(formattedPrompt.toChatMessages());
    const answer =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);

    res.json({
      answer,
      sources: documents.map((d) => ({
        content: d.pageContent.slice(0, 300),
        metadata: d.metadata,
      })),
    });
  } catch (err) {
    console.error('chat error', err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(PORT, () => {
  console.log(`Daksha app-server listening on http://localhost:${PORT}`);
});
