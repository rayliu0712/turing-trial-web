import React, { useState } from 'react';
import { Check } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 animate-in fade-in duration-100">
      <div className="bg-white border border-zinc-200 rounded-xl w-full max-w-sm shadow-xl p-4 space-y-3">
        <div className="border-b border-zinc-100 pb-2">
          <span className="text-xs font-bold text-zinc-900">投票淘汰受驗者</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {candidates.map((name) => {
            const playerObj = players.find((p) => p.name === name);
            const isSelected = selected === name;

            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelected(name)}
                className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-900 text-white'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50 text-zinc-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {playerObj && (
                    <span className={`w-2 h-2 rounded-full shrink-0 ${playerObj.color.avatar}`} />
                  )}
                  <span className="text-xs font-bold">{name}</span>
                </div>

                {isSelected && <Check className="w-3.5 h-3.5 text-white" />}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={() => onSubmitVote(selected)}
          disabled={!selected}
          className="w-full bg-zinc-900 hover:bg-black text-white text-xs font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
        >
          投給「{selected}」
        </button>
      </div>
    </div>
  );
};
