import React, { useState } from 'react';
import { Ear, X, Send } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white">
              <Ear className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900">上帝私密耳語 (Whisper)</h3>
              <p className="text-[11px] text-zinc-500">僅目標受驗者接收，其餘玩家完全不知情</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 選擇受驗者 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700">目標受驗者</label>
          <div className="flex flex-wrap gap-2">
            {alivePlayers.map((player) => (
              <button
                key={player.id}
                type="button"
                onClick={() => setTargetId(player.id)}
                className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                  targetId === player.id
                    ? `${player.color.badge} ring-2 ring-violet-500 font-bold shadow-xs`
                    : 'border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${player.color.avatar}`} />
                {player.name}
              </button>
            ))}
          </div>
        </div>

        {/* 耳語內容輸入 */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-zinc-700">低語指令 / 心理引導</label>
          <textarea
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="例如：懷疑一下剛才說話的那個人、注意不要暴露自己..."
            className="w-full text-xs p-3 border border-zinc-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-violet-500 bg-zinc-50"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-3 py-2 rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 cursor-pointer"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!content.trim()}
            className="flex items-center gap-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white font-medium px-4 py-2 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Send className="w-3.5 h-3.5" />
            發送耳語
          </button>
        </div>
      </div>
    </div>
  );
};

