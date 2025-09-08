import OpenAI from 'openai';
import { AppError } from '@/lib/errors';

let singleton: OpenAI | null = null;

export function getOpenAIClient() {
  if (singleton) return singleton;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new AppError('INVALID_CONFIG', 'OpenAI API key is not configured. Set OPENAI_API_KEY.');
  }
  singleton = new OpenAI({ apiKey });
  return singleton;
}

