import { toTraditional } from './charMap';

export interface VoteResult {
  voter: string;
  target: string;
}

export interface VoteSummary {
  counts: Map<string, number>;
  mostVoted: string[];
  isDraw: boolean;
  totalVotes: number;
}

/**
 * 從模型文字中解析出投票目標姓名
 * 整合單一字元繁簡對照表，自動容錯簡體輸出（如「张家豪」自動轉為「張家豪」）
 */
export function parseVote(rawText: string, validCandidates: readonly string[]): string | null {
  if (!rawText) return null;

  // 1. 先透過繁簡字元對照表正規化為繁體
  const normalizedText = toTraditional(rawText);

  // 2. 優先搜尋 <vote>姓名</vote> 或 <votes>姓名</votes>
  const tagMatch = normalizedText.match(/<votes?>\s*([^<>]+?)\s*<\/votes?>/i);
  if (tagMatch) {
    const rawTarget = tagMatch[1].trim();
    // 檢查精確匹配
    const found = validCandidates.find((c) => c === rawTarget);
    if (found) return found;

    // 檢查包含關係（如模型填入「受驗者張家豪」）
    const partialFound = validCandidates.find((c) => rawTarget.includes(c) || c.includes(rawTarget));
    if (partialFound) return partialFound;
  }

  // 3. Fallback: 直接比對內文中是否有明確提及候選人全名
  const mentioned = validCandidates.filter((name) => normalizedText.includes(name));
  if (mentioned.length === 1) {
    return mentioned[0];
  }

  return null;
}

/**
 * 統計投票結果
 */
export function summarizeVotes(
  votes: readonly VoteResult[],
  survivors: readonly string[],
): VoteSummary {
  const counts = new Map<string, number>();

  // 初始化所有存活者票數為 0
  for (const name of survivors) {
    counts.set(name, 0);
  }

  for (const { target } of votes) {
    counts.set(target, (counts.get(target) ?? 0) + 1);
  }

  // 找出最高票數
  let maxCount = -1;
  for (const count of counts.values()) {
    if (count > maxCount) {
      maxCount = count;
    }
  }

  const mostVoted = survivors.filter((name) => counts.get(name) === maxCount);

  // 奇蹟平票判定：所有人票數皆相同且總票數 > 0
  const allCounts = survivors.map((s) => counts.get(s) ?? 0);
  const isDraw =
    votes.length > 0 &&
    allCounts.every((c) => c === allCounts[0]);

  return {
    counts,
    mostVoted,
    isDraw,
    totalVotes: votes.length,
  };
}

/**
 * 處決決定：同票時隨機挑選一位
 */
export function pickExecuted(mostVoted: readonly string[]): string {
  if (mostVoted.length === 0) return '';
  if (mostVoted.length === 1) return mostVoted[0];
  const randomIndex = Math.floor(Math.random() * mostVoted.length);
  return mostVoted[randomIndex];
}

