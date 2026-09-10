import { VectorStoreRetriever } from '@langchain/core/vectorstores';
import { OpenAIEmbeddings } from '@langchain/openai';
import { SupabaseVectorStore } from '@langchain/community/vectorstores/supabase';
import { Chroma } from '@langchain/community/vectorstores/chroma';
import { createClient } from '@supabase/supabase-js';
import { RunnableConfig } from '@langchain/core/runnables';
import {
  BaseConfigurationAnnotation,
  ensureBaseConfiguration,
} from './configuration.js';

export async function makeSupabaseRetriever(
  configuration: typeof BaseConfigurationAnnotation.State,
): Promise<VectorStoreRetriever> {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables are not defined',
    );
  }
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });
  const supabaseClient = createClient(
    process.env.SUPABASE_URL ?? '',
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
  );
  const vectorStore = new SupabaseVectorStore(embeddings, {
    client: supabaseClient,
    tableName: 'documents',
    queryName: 'match_documents',
  });
  return vectorStore.asRetriever({
    k: configuration.k,
    filter: configuration.filterKwargs,
  });
}

// Local embeddings served by llama.cpp's OpenAI-compatible /v1/embeddings
// endpoint (e.g. `llama-server --embd-gemma-default --embeddings`).
function makeLocalEmbeddings(): OpenAIEmbeddings {
  return new OpenAIEmbeddings({
    model: process.env.LOCAL_EMBEDDING_MODEL || 'embeddinggemma',
    apiKey: 'not-needed',
    configuration: {
      baseURL: process.env.LOCAL_EMBEDDINGS_URL || 'http://localhost:8082/v1',
    },
  });
}

// Chroma requires an explicit `$and` when filtering on more than one field —
// a flat multi-key object like `{case: "1", document: "4"}` is rejected with
// "Invalid where clause".
function toChromaWhere(
  filterKwargs: Record<string, any>,
): Record<string, any> | undefined {
  const entries = Object.entries(filterKwargs).filter(
    ([, v]) => v !== undefined,
  );
  if (entries.length === 0) return undefined;
  if (entries.length === 1) {
    const [key, value] = entries[0];
    return { [key]: value };
  }
  return { $and: entries.map(([key, value]) => ({ [key]: value })) };
}

// Self-hosted Chroma vector store (`docker run chromadb/chroma`), embedded
// with a local model instead of calling out to OpenAI.
export async function makeChromaRetriever(
  configuration: typeof BaseConfigurationAnnotation.State,
): Promise<VectorStoreRetriever> {
  const embeddings = makeLocalEmbeddings();
  const vectorStore = new Chroma(embeddings, {
    collectionName: process.env.CHROMA_COLLECTION || 'daksha_documents',
    url: process.env.CHROMA_URL || 'http://localhost:8200',
  });
  return vectorStore.asRetriever({
    k: configuration.k,
    filter: toChromaWhere(configuration.filterKwargs),
  });
}

export async function makeRetriever(
  config: RunnableConfig,
): Promise<VectorStoreRetriever> {
  const configuration = ensureBaseConfiguration(config);
  switch (configuration.retrieverProvider) {
    case 'supabase':
      return makeSupabaseRetriever(configuration);
    case 'chroma':
      return makeChromaRetriever(configuration);
    default:
      throw new Error(
        `Unsupported retriever provider: ${configuration.retrieverProvider}`,
      );
  }
}
