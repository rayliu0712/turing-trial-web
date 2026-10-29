import type { ModelMessage } from 'ai';

/**
 * 將使用者內容推入 messages 陣列
 * 遵守 @rayliu0712/turing-trial-core 規範：
 * 若最後一則訊息 role 為 user，則以 \n 連接合併，避免連續同 role 造成 API 報錯。
 */
export function pushUserContent(messages: ModelMessage[], content: string): void {
  if (!content) return;
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.role === 'user') {
    if (typeof lastMsg.content === 'string') {
      lastMsg.content += `\n${content}`;
    } else {
      messages.push({ role: 'user', content });
    }
  } else {
    messages.push({ role: 'user', content });
  }
}

/**
 * 將 AI 自身內容推入 messages 陣列
 * 若最後一則訊息 role 為 assistant，則以 \n 連接合併。
 */
export function pushAiContent(messages: ModelMessage[], content: string): void {
  if (!content) return;
  const lastMsg = messages[messages.length - 1];
  if (lastMsg && lastMsg.role === 'assistant') {
    if (typeof lastMsg.content === 'string') {
      lastMsg.content += `\n${content}`;
    } else {
      messages.push({ role: 'assistant', content });
    }
  } else {
    messages.push({ role: 'assistant', content });
  }
}

