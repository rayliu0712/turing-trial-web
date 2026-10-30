import { tify } from 'chinese-conv';

/**
 * 將簡體字轉換為繁體字
 * 使用可靠且輕量的單一字繁簡轉換庫 (chinese-conv，源自新同文堂字庫，支援使用者自訂姓名之所有漢字)
 */
export function toTraditional(text: string): string {
  if (!text) return '';
  return tify(text);
}
