import axios from 'axios';

type PromptMap = Record<string, string[]>;

let cache: PromptMap | null = null;

async function loadPrompts(): Promise<PromptMap> {
  if (cache) {
    return cache;
  }
  const { data } = await axios.get<PromptMap>('/prompts.json', {
    headers: { 'Cache-Control': 'no-cache' }
  });
  cache = data;
  return data;
}

export async function getPrompts(key: string): Promise<string[]> {
  const map = await loadPrompts();
  return map[key] ?? [];
}

