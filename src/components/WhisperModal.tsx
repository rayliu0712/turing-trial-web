import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Player } from '../domain/types';

interface WhisperModalProps {
  isOpen: boolean;
  onClose: () => void;
  alivePlayers: Player[];
  selectedPlayerId?: string;
  onSendWhisper: (targetId: string, content: string) => void;
}

export const WhisperModal: React.FC<WhisperModalProps> = ({
  isOpen,
  onClose,
  alivePlayers,
  selectedPlayerId,
  onSendWhisper,
}) => {
  const [targetId, setTargetId] = useState<string>(
    selectedPlayerId || alivePlayers[0]?.id || '',
  );
  const [content, setContent] = useState('');

  if (!isOpen) return null;

  const currentTarget = alivePlayers.find((p) => p.id === targetId) || alivePlayers[0];

  const handleSend = () => {
    if (!content.trim() || !currentTarget) return;
    onSendWhisper(currentTarget.id, content.trim());
    setContent('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
          <span className="text-xs font-bold text-zinc-900">私密耳語</span>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded cursor-pointer"
            title="關閉"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 選擇受驗者 */}
        <div className="flex flex-wrap gap-1.5">
          {alivePlayers.map((player) => (
            <button
              key={player.id}
              type="button"
              onClick={() => setTargetId(player.id)}
              className={`text-xs px-2.5 py-1 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                targetId === player.id
                  ? `${player.color.badge} ring-1 ring-zinc-900 font-bold`
                  : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${player.color.avatar}`} />
              {player.name}
            </button>
          ))}
        </div>

        {/* 耳語輸入 */}
        <textarea
          rows={3}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="耳語指令 (Ctrl+Enter 送出，Enter 換行)..."
          className="w-full text-xs p-2.5 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-zinc-900 bg-zinc-50"
          autoFocus
        />

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-1.5 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim()}
            className="text-xs bg-zinc-900 hover:bg-black text-white font-medium px-3.5 py-1.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
            title="發送 (Ctrl+Enter)"
          >
            發送
          </button>
        </div>
      </div>
    </div>
  );
};
