import type { ModelMessage } from 'ai';
import type { PlayerColorTheme } from './playerColors';

export type GameStatus =
  | 'IDLE'                 // 尚未開局 (設定頁)
  | 'RUNNING'              // 遊戲進行中
  | 'PAUSED'               // 人類按下暫停
  | 'AWAITING_HUMAN_SPEAK' // 等待真人發言
  | 'AWAITING_HUMAN_VOTE'  // 等待真人投票
  | 'ROUND_TRANSITION'     // 輪次切換過渡
  | 'GAME_OVER';           // 遊戲結束 (奇蹟平票或存活<=2)

export type VotePhase = 'nomination' | 'execution';

export interface Player {
  id: string;
  name: string;
  bio?: string;
  isHuman: boolean;
  color: PlayerColorTheme;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  isAlive: boolean;
  messages: ModelMessage[];
}

export type ChatItem =
  | {
      id: string;
      type: 'speak';
      speakerId: string;
      speakerName: string;
      color: PlayerColorTheme;
      content: string;
      isStreaming?: boolean;
      timestamp: number;
    }
  | {
      id: string;
      type: 'broadcast';
      content: string;
      timestamp: number;
    }
  | {
      id: string;
      type: 'whisper';
      targetId: string;
      targetName: string;
      targetColor: PlayerColorTheme;
      content: string;
      timestamp: number;
    }
  | {
      id: string;
      type: 'system';
      content: string;
      badge?: string;
      timestamp: number;
    }
  | {
      id: string;
      type: 'vote-reveal';
      phase?: VotePhase;
      votes: Array<{ voter: string; target: string }>;
      counts: Array<[string, number]>;
      isDraw: boolean;
      timestamp: number;
    }
  | {
      id: string;
      type: 'execute';
      executedName: string;
      executedColor: PlayerColorTheme;
      timestamp: number;
    };

export interface GameSettings {
  doubleVote: boolean;
  voteMaxRetry: number;
  hasHumanPlayer: boolean;
}

