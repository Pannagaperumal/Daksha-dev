import { ChatPromptTemplate } from '@langchain/core/prompts';

const ROUTER_SYSTEM_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    "You are a routing assistant. Your job is to determine if a question needs document retrieval or can be answered directly.\n\nRespond with either:\n'retrieve' - if the question requires retrieving documents\n'direct' - if the question can be answered directly AND your direct answer",
  ],
  ['human', '{query}'],
]);

const RESPONSE_SYSTEM_PROMPT = ChatPromptTemplate.fromMessages([
  [
    'system',
    `Answer using ONLY the <documents> below, from this case's PDFs. Be
specific (quote names/dates/amounts). If not covered, say "The uploaded
documents don't mention that." Max 5 sentences unless a list is asked for.

<documents>
{context}
</documents>`,
  ],
  ['human', '{question}'],
]);

export { ROUTER_SYSTEM_PROMPT, RESPONSE_SYSTEM_PROMPT };
