import React, { useState } from 'react';
import { Vote, Check } from 'lucide-react';
import type { Player } from '../domain/types';

interface HumanVoteModalProps {
  candidates: string[];
  players: Player[];
  onSubmitVote: (target: string) => void;
}

export const HumanVoteModal: React.FC<HumanVoteModalProps> = ({
  candidates,
  players,
  onSubmitVote,
}) => {
  const [selected, setSelected] = useState<string>(candidates[0] || '');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5">
        <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shadow-xs">
            <Vote className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-zinc-900">
              圖靈審判 // 受驗者投票環節
            </h3>
            <p className="text-xs text-zinc-500">
              請謹慎選擇你認為最像 AI 滲透者、應被投票淘汰的受驗者。
            </p>
          </div>
        </div>

        {/* 候選人卡片清單 */}
        <div className="grid grid-cols-2 gap-3">
          {candidates.map((name) => {
            const playerObj = players.find((p) => p.name === name);
            const isSelected = selected === name;

            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white shadow-md'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {playerObj && (
                    <span
                      className={`w-3 h-3 rounded-full shrink-0 ${playerObj.color.avatar}`}
                    />
                  )}
                  <div>
                    <div className="text-xs font-bold">{name}</div>
                    {playerObj?.bio && (
                      <div
                        className={`text-[10px] truncate max-w-[120px] ${
                          isSelected ? 'text-zinc-300' : 'text-zinc-500'
                        }`}
                      >
                        {playerObj.bio}
                      </div>
                    )}
                  </div>
                </div>

                {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        <div className="pt-2">
          <button
            type="button"
            onClick={() => onSubmitVote(selected)}
            disabled={!selected}
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold py-3 rounded-xl shadow-md transition-colors disabled:opacity-50 cursor-pointer"
          >
            投給「{selected}」
          </button>
        </div>
      </div>
    </div>
  );
};

