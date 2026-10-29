import React from 'react';
import { Megaphone, Ear, Skull, Vote, AlertTriangle } from 'lucide-react';
import type { ChatItem } from '../domain/types';

interface ChatMessageItemProps {
  item: ChatItem;
  onQuickWhisper?: (playerId: string, playerName: string) => void;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ item, onQuickWhisper }) => {
  switch (item.type) {
    case 'speak': {
      return (
        <div className="flex items-start gap-3 group animate-in fade-in duration-150">
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${item.color.avatar}`}
          >
            {item.speakerName.slice(0, 1)}
          </div>

          <div className="flex-1 max-w-2xl space-y-1">
            <div className="flex items-center gap-2">
              <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold border ${item.color.badge}`}>
                {item.speakerName}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>

              {onQuickWhisper && (
                <button
                  type="button"
                  onClick={() => onQuickWhisper(item.speakerId, item.speakerName)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 text-zinc-400 hover:text-zinc-900 rounded cursor-pointer"
                  title={`對 ${item.speakerName} 耳語`}
                >
                  <Ear className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="bg-white border border-zinc-200 rounded-xl rounded-tl-xs px-3.5 py-2.5 text-xs text-zinc-800 leading-relaxed shadow-2xs whitespace-pre-wrap break-words">
              {item.content}
              {item.isStreaming && (
                <span className="inline-block w-1.5 h-3.5 ml-1 bg-zinc-900 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'broadcast': {
      return (
        <div className="my-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <Megaphone className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-950 font-medium leading-relaxed">
            <span className="font-bold text-amber-800 mr-1.5">廣播</span>
            {item.content}
          </div>
        </div>
      );
    }

    case 'whisper': {
      return (
        <div className="my-1.5 p-2.5 bg-violet-50/60 border border-violet-200 rounded-xl flex items-start gap-2.5 shadow-2xs">
          <Ear className="w-4 h-4 text-violet-600 shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-violet-950">
            <span className="font-bold text-violet-800 mr-1.5">[耳語 → {item.targetName}]</span>
            {item.content}
          </div>
        </div>
      );
    }

    case 'system': {
      return (
        <div className="flex items-center justify-center my-3">
          <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-zinc-100 border border-zinc-200 text-[11px] font-medium text-zinc-600">
            {item.badge && (
              <span className="font-bold text-zinc-900 border-r border-zinc-300 pr-1.5">
                {item.badge}
              </span>
            )}
            <span>{item.content}</span>
          </div>
        </div>
      );
    }

    case 'vote-reveal': {
      const phaseTitle = item.phase === 'nomination' ? '提名投票' : '處決投票';

      return (
        <div className="my-3 p-3.5 bg-white border border-zinc-200 rounded-xl shadow-2xs space-y-2.5">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-1.5">
            <div className="flex items-center gap-1.5 text-zinc-900 font-bold text-xs">
              <Vote className="w-3.5 h-3.5 text-zinc-600" />
              <span>{phaseTitle}</span>
            </div>
            {item.isDraw && (
              <span className="text-[11px] text-amber-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                奇蹟平票
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {item.counts.map(([candidate, count]) => (
              <div
                key={candidate}
                className="p-2 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center justify-between"
              >
                <span className="text-xs text-zinc-700">{candidate}</span>
                <span className="text-xs font-bold text-zinc-900 bg-white px-1.5 py-0.5 rounded border border-zinc-200">
                  {count} 票
                </span>
              </div>
            ))}
          </div>

          <div className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-1.5 flex flex-wrap gap-x-3 gap-y-1">
            {item.votes.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span>{v.voter}</span>
                <span className="text-zinc-400">➔</span>
                <span className="text-zinc-900 font-medium">{v.target}</span>
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'execute': {
      return (
        <div className="my-3 p-3 bg-zinc-900 text-white rounded-xl flex items-center gap-3 shadow-md">
          <Skull className="w-5 h-5 text-rose-500 shrink-0" />
          <div className="text-xs text-zinc-300">
            抹殺受驗者：
            <span className={`font-bold ml-1 px-1.5 py-0.5 rounded ${item.executedColor.badge}`}>
              {item.executedName}
            </span>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
