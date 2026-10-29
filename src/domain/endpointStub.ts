import { createOpenAICompatible } from '@ai-sdk/openai-compatible';

export interface PlayerApiConfig {
  id: string;
  name: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
}

export interface ResolvedEndpoint {
  baseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
}

/**
 * Endpoint Stub 層
 * 將 UI 輸入的 baseUrl 與 apiKey 進行抽象解析。
 * 未來在「Demo 模式」下，可在此 stub 內無縫切換為同源後端或 proxy，而不影響遊戲業務邏輯。
 */
export function resolvePlayerEndpoint(config: PlayerApiConfig): ResolvedEndpoint {
  const cleanBaseUrl = (config.baseUrl || '').trim().replace(/\/+$/, '');
  const cleanApiKey = (config.apiKey || '').trim();

  return {
    baseUrl: cleanBaseUrl,
    apiKey: cleanApiKey,
    headers: config.headers,
  };
}

/**
 * 依據 Stub 解析結果建立 OpenAI-compatible LanguageModel 實例
 */
export function createPlayerLanguageModel(config: PlayerApiConfig) {
  const { baseUrl, apiKey, headers } = resolvePlayerEndpoint(config);

  const provider = createOpenAICompatible({
    name: `player-${config.id}`,
    baseURL: baseUrl,
    apiKey: apiKey,
    headers: headers,
  });

  return provider(config.modelName || 'default');
}
