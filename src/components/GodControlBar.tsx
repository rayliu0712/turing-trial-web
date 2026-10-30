import React, { useState } from 'react';
import { Ear, Pause, Play, RotateCcw, Send } from 'lucide-react';
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
    <div className="sticky bottom-0 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-4 py-2.5 shadow-md z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-2">
        {/* 控制按鈕組 (圖示按鈕) */}
        {!isGameOver ? (
          <button
            type="button"
            onClick={isPaused ? onResume : onPause}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isPaused
                ? 'bg-emerald-600 text-white'
                : 'bg-zinc-900 hover:bg-black text-white'
            }`}
            title={isPaused ? '繼續' : '暫停'}
          >
            {isPaused ? <Play className="w-4 h-4 fill-white" /> : <Pause className="w-4 h-4" />}
          </button>
        ) : (
          <button
            type="button"
            onClick={onRestart}
            className="p-2 rounded-lg bg-zinc-900 hover:bg-black text-white transition-colors cursor-pointer"
            title="重置"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        <button
          type="button"
          onClick={onOpenWhisper}
          disabled={isGameOver}
          className="p-2 rounded-lg border border-zinc-200 hover:bg-zinc-100 text-zinc-700 transition-colors disabled:opacity-40 cursor-pointer"
          title="耳語"
        >
          <Ear className="w-4 h-4" />
        </button>

        {/* 廣播輸入欄 */}
        <input
          type="text"
          value={broadcastInput}
          onChange={(e) => setBroadcastInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return;
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSendBroadcast();
            }
          }}
          placeholder="廣播訊息 (Ctrl+Enter 送出)..."
          className="flex-1 text-xs px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 focus:bg-white"
        />

        <button
          type="button"
          onClick={handleSendBroadcast}
          disabled={!broadcastInput.trim()}
          className="p-2 bg-zinc-900 hover:bg-black text-white rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
          title="廣播 (Ctrl+Enter)"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
