import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { initChatModel } from 'langchain/chat_models/universal';
import { ChatOpenAI } from '@langchain/openai';

const SUPPORTED_PROVIDERS = [
  'openai',
  'anthropic',
  'azure_openai',
  'cohere',
  'google-vertexai',
  'google-vertexai-web',
  'google-genai',
  'ollama',
  'together',
  'fireworks',
  'mistralai',
  'groq',
  'bedrock',
  'cerebras',
  'deepseek',
  'xai',
] as const;
/**
 * Load a chat model from a fully specified name.
 * @param fullySpecifiedName - String in the format 'provider/model' or 'provider/account/provider/model'.
 * @returns A Promise that resolves to a BaseChatModel instance.
 */
export async function loadChatModel(
  fullySpecifiedName: string,
  temperature: number = 0.2,
): Promise<BaseChatModel> {
  // Local models served by llama.cpp's OpenAI-compatible /v1/chat/completions
  // endpoint (e.g. `llama-server -m <model>.gguf --port 8081`).
  if (fullySpecifiedName.startsWith('local/')) {
    return new ChatOpenAI({
      model: fullySpecifiedName.slice('local/'.length),
      apiKey: 'not-needed',
      temperature,
      maxTokens: 200,
      configuration: {
        baseURL: process.env.LOCAL_CHAT_URL || 'http://localhost:8081/v1',
      },
    });
  }

  const index = fullySpecifiedName.indexOf('/');
  if (index === -1) {
    // If there's no "/", assume it's just the model
    if (
      !SUPPORTED_PROVIDERS.includes(
        fullySpecifiedName as (typeof SUPPORTED_PROVIDERS)[number],
      )
    ) {
      throw new Error(`Unsupported model: ${fullySpecifiedName}`);
    }
    return await initChatModel(fullySpecifiedName, {
      temperature: temperature,
    });
  } else {
    const provider = fullySpecifiedName.slice(0, index);
    const model = fullySpecifiedName.slice(index + 1);
    if (
      !SUPPORTED_PROVIDERS.includes(
        provider as (typeof SUPPORTED_PROVIDERS)[number],
      )
    ) {
      throw new Error(`Unsupported provider: ${provider}`);
    }
    return await initChatModel(model, {
      modelProvider: provider,
      temperature: temperature,
    });
  }
}
