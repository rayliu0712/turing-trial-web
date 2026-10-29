import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ChatMessageItem } from './ChatMessageItem';
import { GodControlBar } from './GodControlBar';
import { WhisperModal } from './WhisperModal';
import { HumanInputDeck } from './HumanInputDeck';
import { HumanVoteModal } from './HumanVoteModal';
import type { Player, ChatItem, GameStatus } from '../domain/types';

interface ChatFeedProps {
  players: Player[];
  chatItems: ChatItem[];
  status: GameStatus;
  roundIndex: number;
  voteCandidates: string[] | null;
  onPause: () => void;
  onResume: () => void;
  onBroadcast: (content: string) => void;
  onWhisper: (targetId: string, content: string) => void;
  onSubmitHumanSpeak: (content: string) => void;
  onSubmitHumanVote: (target: string) => void;
  onRestart: () => void;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({
  players,
  chatItems,
  status,
  roundIndex,
  voteCandidates,
  onPause,
  onResume,
  onBroadcast,
  onWhisper,
  onSubmitHumanSpeak,
  onSubmitHumanVote,
  onRestart,
}) => {
  const [whisperOpen, setWhisperOpen] = useState(false);
  const [selectedWhisperId, setSelectedWhisperId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const alivePlayers = players.filter((p) => p.isAlive);
  const humanPlayer = players.find((p) => p.isHuman && p.isAlive);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems, status]);

  const handleOpenQuickWhisper = (playerId: string) => {
    setSelectedWhisperId(playerId);
    setWhisperOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      {/* 頂部狀態列 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-2.5 shadow-2xs">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onRestart}
              className="p-1 text-zinc-500 hover:text-zinc-900 rounded cursor-pointer"
              title="返回設定"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <span className="text-xs font-bold text-zinc-900">圖靈審判</span>
            <span className="text-zinc-300">•</span>
            <span className="text-xs font-mono text-zinc-500">第 {roundIndex} 輪</span>

            {status !== 'RUNNING' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono">
                {status === 'PAUSED'
                  ? '已暫停'
                  : status === 'AWAITING_HUMAN_SPEAK'
                  ? '等待發言'
                  : status === 'AWAITING_HUMAN_VOTE'
                  ? '投票中'
                  : status === 'GAME_OVER'
                  ? '結束'
                  : ''}
              </span>
            )}
          </div>

          {/* 存活受驗者名單 (點選耳語) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[60%]">
            {players.map((p) => {
              if (!p.isAlive) {
                return (
                  <span
                    key={p.id}
                    className="text-[10px] px-1.5 py-0.5 rounded border border-zinc-200 text-zinc-400 line-through shrink-0"
                    title={`${p.name} (已抹殺)`}
                  >
                    {p.name}
                  </span>
                );
              }

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleOpenQuickWhisper(p.id)}
                  title={`對 ${p.name} 耳語`}
                  className={`text-[11px] px-2 py-0.5 rounded font-semibold border shrink-0 cursor-pointer ${p.color.badge}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 聊天室主視圖 */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-3">
        {chatItems.map((item) => (
          <ChatMessageItem
            key={item.id}
            item={item}
            onQuickWhisper={handleOpenQuickWhisper}
          />
        ))}

        {status === 'AWAITING_HUMAN_SPEAK' && humanPlayer && (
          <HumanInputDeck
            humanPlayer={humanPlayer}
            onSubmitSpeak={onSubmitHumanSpeak}
          />
        )}

        <div ref={messagesEndRef} />
      </main>

      {/* 真人投票彈窗 */}
      {status === 'AWAITING_HUMAN_VOTE' && voteCandidates && (
        <HumanVoteModal
          candidates={voteCandidates}
          players={players}
          onSubmitVote={onSubmitHumanVote}
        />
      )}

      {/* 耳語彈窗 */}
      <WhisperModal
        isOpen={whisperOpen}
        onClose={() => setWhisperOpen(false)}
        alivePlayers={alivePlayers}
        selectedPlayerId={selectedWhisperId}
        onSendWhisper={onWhisper}
      />

      {/* 上帝控制列 */}
      <GodControlBar
        status={status}
        onPause={onPause}
        onResume={onResume}
        onBroadcast={onBroadcast}
        onOpenWhisper={() => {
          setSelectedWhisperId(undefined);
          setWhisperOpen(true);
        }}
        onRestart={onRestart}
      />
    </div>
  );
};
