import React, { useState } from 'react';
import { Send, UserCheck } from 'lucide-react';
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
    <div className="p-4 bg-zinc-900 text-white rounded-2xl shadow-xl border border-zinc-800 space-y-3 animate-in slide-in-from-bottom duration-300">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500 flex items-center justify-center text-white">
            <UserCheck className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white">
              輪到你發言：{humanPlayer?.name}
            </h4>
            <p className="text-[11px] text-zinc-400">
              請陳述你的發言以爭取同伴信任。可使用括號如（緊張）表達動作情緒。
            </p>
          </div>
        </div>
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
          placeholder="輸入你的發言內容（Enter 送出，Shift+Enter 換行）..."
          className="flex-1 text-xs p-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
          autoFocus
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!content.trim()}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-4 rounded-xl flex items-center justify-center transition-colors disabled:opacity-40 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

