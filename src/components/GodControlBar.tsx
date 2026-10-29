import React, { useState } from 'react';
import { Megaphone, Ear, Pause, Play, RotateCcw, Send } from 'lucide-react';
import type { GameStatus } from '../domain/types';

interface GodControlBarProps {
  status: GameStatus;
  onPause: () => void;
  onResume: () => void;
  onBroadcast: (content: string) => void;
  onOpenWhisper: () => void;
  onRestart: () => void;
}

export const GodControlBar: React.FC<GodControlBarProps> = ({
  status,
  onPause,
  onResume,
  onBroadcast,
  onOpenWhisper,
  onRestart,
}) => {
  const [broadcastInput, setBroadcastInput] = useState('');

  const isPaused = status === 'PAUSED';
  const isGameOver = status === 'GAME_OVER';

  const handleSendBroadcast = () => {
    if (!broadcastInput.trim()) return;
    onBroadcast(broadcastInput.trim());
    setBroadcastInput('');
  };

  return (
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-3 shadow-lg z-40">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-3">
        {/* 控制按鈕組 (暫停/繼續, 耳語, 重啟) */}
        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-between sm:justify-start">
          {!isGameOver ? (
            <button
              type="button"
              onClick={isPaused ? onResume : onPause}
              className={`flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl transition-all cursor-pointer shadow-xs ${
                isPaused
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white animate-bounce'
                  : 'bg-zinc-900 hover:bg-black text-white'
              }`}
            >
              {isPaused ? (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  恢復審判
                </>
              ) : (
                <>
                  <Pause className="w-4 h-4" />
                  即刻喊停
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onRestart}
              className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 rounded-xl bg-zinc-900 hover:bg-black text-white transition-all cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-4 h-4" />
              重新開局
            </button>
          )}

          {/* 私密耳語按鈕 */}
          <button
            type="button"
            onClick={onOpenWhisper}
            disabled={isGameOver}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2.5 rounded-xl border border-violet-200 bg-violet-50 hover:bg-violet-100 text-violet-700 transition-colors disabled:opacity-50 cursor-pointer shadow-2xs"
          >
            <Ear className="w-4 h-4 text-violet-600" />
            上帝耳語
          </button>
        </div>

        {/* 廣播輸入框 */}
        <div className="relative flex-1 w-full flex items-center gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={broadcastInput}
              onChange={(e) => setBroadcastInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendBroadcast();
                }
              }}
              placeholder="全場廣播指令（例如：你們之中有人說謊了、請陳雅婷回應...）"
              className="w-full text-xs pl-8 pr-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-zinc-900"
            />
            <Megaphone className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-3" />
          </div>

          <button
            type="button"
            onClick={handleSendBroadcast}
            disabled={!broadcastInput.trim()}
            className="flex items-center gap-1 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white px-4 py-2.5 rounded-xl transition-colors disabled:opacity-40 cursor-pointer shrink-0 shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            廣播
          </button>
        </div>
      </div>
    </div>
  );
};

