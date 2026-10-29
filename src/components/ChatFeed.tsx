import React, { useState, useRef, useEffect } from 'react';
import { Shield, Users, ArrowLeft, Radio } from 'lucide-react';
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

  // 當有新訊息時自動捲動至底端
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatItems, status]);

  const handleOpenQuickWhisper = (playerId: string) => {
    setSelectedWhisperId(playerId);
    setWhisperOpen(true);
  };

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 text-zinc-900">
      {/* 頂部避難所狀態列 */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 py-3 shadow-2xs">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={onRestart}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="返回設定重啟"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center font-black">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-sm font-extrabold tracking-tight text-zinc-900">
                  圖靈審判 // 地下避難所
                </h1>
                <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-mono">
                  <span>第 {roundIndex} 輪審判</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Radio className="w-3 h-3 text-emerald-500 animate-pulse" />
                    狀態：
                    {status === 'PAUSED'
                      ? '暫停中 (已中斷)'
                      : status === 'AWAITING_HUMAN_SPEAK'
                      ? '等待真人發言'
                      : status === 'AWAITING_HUMAN_VOTE'
                      ? '等待真人投票'
                      : status === 'GAME_OVER'
                      ? '審判已終止'
                      : '進行中'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 存活受驗者名單 (可點擊快速耳語) */}
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 flex items-center gap-1 shrink-0 mr-1">
              <Users className="w-3 h-3" />
              存活 ({alivePlayers.length}):
            </span>
            {players.map((p) => {
              if (!p.isAlive) {
                return (
                  <span
                    key={p.id}
                    className="text-[10px] px-2 py-0.5 rounded-md border border-zinc-200 bg-zinc-100 text-zinc-400 line-through shrink-0"
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
                  title={`點擊對 ${p.name} 耳語`}
                  className={`text-[11px] px-2.5 py-0.5 rounded-md font-semibold border shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer shadow-2xs ${p.color.badge}`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* 聊天室主流 */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {chatItems.map((item) => (
          <ChatMessageItem
            key={item.id}
            item={item}
            onQuickWhisper={handleOpenQuickWhisper}
          />
        ))}

        {/* 等待真人玩家發言輸入卡片 */}
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

      {/* 上帝私密耳語彈窗 */}
      <WhisperModal
        isOpen={whisperOpen}
        onClose={() => setWhisperOpen(false)}
        alivePlayers={alivePlayers}
        selectedPlayerId={selectedWhisperId}
        onSendWhisper={onWhisper}
      />

      {/* 上帝全域控制面板 */}
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

