import React, { useState } from 'react';
import { Send } from 'lucide-react';
import type { Player } from '../domain/types';

interface HumanInputDeckProps {
  humanPlayer?: Player;
  onSubmitSpeak: (content: string) => void;
}

export const HumanInputDeck: React.FC<HumanInputDeckProps> = ({
  humanPlayer,
  onSubmitSpeak,
}) => {
  const [content, setContent] = useState('');

  const handleSend = () => {
    if (!content.trim()) return;
    onSubmitSpeak(content.trim());
    setContent('');
  };

  return (
    <div className="p-3 bg-zinc-900 text-white rounded-xl shadow-lg border border-zinc-800 space-y-2 animate-in fade-in duration-150">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300">
          輪到你發言：{humanPlayer?.name}
        </span>
      </div>

      <div className="flex gap-2">
        <textarea
          rows={2}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="輸入發言內容 (Enter 送出)..."
          className="flex-1 text-xs p-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-hidden focus:ring-1 focus:ring-zinc-400"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim()}
          className="p-3 bg-white text-zinc-900 rounded-lg flex items-center justify-center transition-colors disabled:opacity-30 cursor-pointer"
          title="送出"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
