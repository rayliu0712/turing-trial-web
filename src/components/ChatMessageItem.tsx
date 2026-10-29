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
        <div className="flex items-start gap-3 group animate-in fade-in duration-200">
          {/* 玩家彩色頭像 */}
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 shadow-xs ${item.color.avatar}`}
          >
            {item.speakerName.slice(0, 1)}
          </div>

          <div className="flex-1 max-w-2xl space-y-1">
            {/* 玩家姓名標籤與時間 */}
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-md font-semibold border ${item.color.badge}`}>
                {item.speakerName}
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>

              {/* 上帝快捷私語按鈕 */}
              {onQuickWhisper && (
                <button
                  type="button"
                  onClick={() => onQuickWhisper(item.speakerId, item.speakerName)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] text-zinc-500 hover:text-zinc-900 flex items-center gap-1 bg-zinc-100 hover:bg-zinc-200 px-2 py-0.5 rounded cursor-pointer"
                  title={`對 ${item.speakerName} 竊竊私語`}
                >
                  <Ear className="w-3 h-3" />
                  耳語
                </button>
              )}
            </div>

            {/* 發言氣泡 (白底黑字 shadcn 風格) */}
            <div className="bg-white border border-zinc-200 rounded-2xl rounded-tl-xs px-4 py-3 text-sm text-zinc-800 leading-relaxed shadow-xs whitespace-pre-wrap break-words">
              {item.content}
              {item.isStreaming && (
                <span className="inline-block w-2 h-4 ml-1 bg-zinc-900 animate-pulse align-middle" />
              )}
            </div>
          </div>
        </div>
      );
    }

    case 'broadcast': {
      return (
        <div className="my-2 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex items-start gap-3 shadow-xs animate-in zoom-in-95 duration-200">
          <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-xs mt-0.5">
            <Megaphone className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-amber-800 tracking-wider">
                避難所全域廣播
              </span>
              <span className="text-[10px] text-amber-600 font-mono">
                {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm font-semibold text-amber-950 leading-relaxed">
              {item.content}
            </p>
          </div>
        </div>
      );
    }

    case 'whisper': {
      return (
        <div className="my-1.5 p-3 bg-violet-50/60 border border-violet-200 rounded-xl flex items-start gap-3 shadow-xs animate-in fade-in duration-200">
          <div className="w-7 h-7 rounded-lg bg-violet-600 flex items-center justify-center text-white shrink-0 mt-0.5">
            <Ear className="w-4 h-4" />
          </div>
          <div className="flex-1 space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-violet-800">
                [上帝私密耳語 → {item.targetName}]
              </span>
              <span className="text-[10px] text-violet-500 italic">
                (僅該受驗者接收，其他人不知情)
              </span>
            </div>
            <p className="text-xs font-medium text-violet-950">
              {item.content}
            </p>
          </div>
        </div>
      );
    }

    case 'system': {
      return (
        <div className="flex items-center justify-center my-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-100 border border-zinc-200 text-xs font-medium text-zinc-600 shadow-2xs">
            {item.badge && (
              <span className="font-bold text-zinc-900 border-r border-zinc-300 pr-2">
                {item.badge}
              </span>
            )}
            <span>{item.content}</span>
          </div>
        </div>
      );
    }

    case 'vote-reveal': {
      const phaseTitle = item.phase === 'nomination' ? '提名投票統計' : '抹殺投票統計';

      return (
        <div className="my-4 p-4 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-3 animate-in fade-in duration-300">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
            <div className="flex items-center gap-2 text-zinc-900 font-bold text-sm">
              <Vote className="w-4 h-4 text-zinc-700" />
              <span>{phaseTitle}</span>
            </div>
            {item.isDraw && (
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                奇蹟全員同票
              </span>
            )}
          </div>

          {/* 得票數長條/統計 */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {item.counts.map(([candidate, count]) => (
              <div
                key={candidate}
                className="p-2.5 rounded-lg border border-zinc-100 bg-zinc-50 flex items-center justify-between"
              >
                <span className="text-xs font-medium text-zinc-700">{candidate}</span>
                <span className="text-xs font-bold text-zinc-900 bg-white px-2 py-0.5 rounded border border-zinc-200 shadow-2xs">
                  {count} 票
                </span>
              </div>
            ))}
          </div>

          {/* 亮票明細 */}
          <div className="text-[11px] text-zinc-500 border-t border-zinc-100 pt-2 flex flex-wrap gap-x-4 gap-y-1">
            {item.votes.map((v, i) => (
              <span key={i} className="inline-flex items-center gap-1">
                <span className="text-zinc-700 font-medium">{v.voter}</span>
                <span className="text-zinc-400">➔</span>
                <span className="text-zinc-900 font-semibold">{v.target}</span>
              </span>
            ))}
          </div>
        </div>
      );
    }

    case 'execute': {
      return (
        <div className="my-4 p-4 bg-zinc-950 text-white rounded-xl border border-zinc-800 shadow-lg flex items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-10 h-10 rounded-xl bg-rose-600 flex items-center justify-center text-white shrink-0 shadow-md">
            <Skull className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-0.5 flex-1">
            <div className="text-xs uppercase tracking-widest text-rose-400 font-mono font-bold">
              // ELIMINATION PROTOCOL //
            </div>
            <div className="text-base font-extrabold text-white flex items-center gap-2">
              抹殺受驗者：
              <span className={`px-2 py-0.5 rounded-md text-sm ${item.executedColor.badge}`}>
                {item.executedName}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              該受驗者已被密室除名，其通訊線路已永久切斷。
            </p>
          </div>
        </div>
      );
    }

    default:
      return null;
  }
};
