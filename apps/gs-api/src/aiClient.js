import OpenAI from 'openai';

let aiClient;

export function getAIClient() {
  if (aiClient) {
    return aiClient;
  }

  const baseURL = process.env.CF_GATEWAY_URL;
  const apiKey = process.env.CF_AIG_TOKEN;

  if (!baseURL) {
    throw new Error('CF_GATEWAY_URL is required to initialize the AI client.');
  }

  if (!apiKey) {
    throw new Error('CF_AIG_TOKEN is required to initialize the AI client.');
  }

  aiClient = new OpenAI({
    apiKey,
    baseURL,
  });

  return aiClient;
}
