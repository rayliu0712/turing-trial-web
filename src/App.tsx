import React, { useState, useRef, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { ChatFeed } from './components/ChatFeed';
import { TuringGameEngine } from './domain/gameEngine';
import type { Player, ChatItem, GameSettings, GameStatus } from './domain/types';

export const App: React.FC = () => {
  const [phase, setPhase] = useState<'SETUP' | 'GAME'>('SETUP');
  const [players, setPlayers] = useState<Player[]>([]);
  const [chatItems, setChatItems] = useState<ChatItem[]>([]);
  const [status, setStatus] = useState<GameStatus>('IDLE');
  const [roundIndex, setRoundIndex] = useState(0);
  const [voteCandidates, setVoteCandidates] = useState<string[] | null>(null);

  const engineRef = useRef<TuringGameEngine | null>(null);

  const handleStartGame = useCallback((initialPlayers: Player[], settings: GameSettings) => {
    setPlayers(initialPlayers);
    setChatItems([]);
    setRoundIndex(0);
    setPhase('GAME');

    const engine = new TuringGameEngine(settings, {
      onStatusChange: (newStatus) => setStatus(newStatus),
      onRoundChange: (newRound) => setRoundIndex(newRound),
      onPlayersChange: (updatedPlayers) => setPlayers([...updatedPlayers]),
      onAddChatItem: (item) => setChatItems((prev) => [...prev, item]),
      onUpdateStreamingItem: (id, text) => {
        setChatItems((prev) =>
          prev.map((item) =>
            item.id === id ? { ...item, content: text, isStreaming: false } : item,
          ),
        );
      },
      onPromptHumanSpeak: () => {
        // UI 會根據 status === 'AWAITING_HUMAN_SPEAK' 顯示輸入框
      },
      onPromptHumanVote: (candidates) => {
        setVoteCandidates(candidates);
      },
    });

    engineRef.current = engine;
    engine.init(initialPlayers);
    engine.start();
  }, []);

  const handlePause = useCallback(() => {
    engineRef.current?.pause();
  }, []);

  const handleResume = useCallback(() => {
    engineRef.current?.resume();
  }, []);

  const handleBroadcast = useCallback((content: string) => {
    engineRef.current?.broadcast(content);
  }, []);

  const handleWhisper = useCallback((targetId: string, content: string) => {
    engineRef.current?.whisper(targetId, content);
  }, []);

  const handleSubmitHumanSpeak = useCallback((content: string) => {
    engineRef.current?.submitHumanSpeak(content);
  }, []);

  const handleSubmitHumanVote = useCallback((target: string) => {
    setVoteCandidates(null);
    engineRef.current?.submitHumanVote(target);
  }, []);

  const handleRestart = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.destroy();
      engineRef.current = null;
    }
    setPhase('SETUP');
    setStatus('IDLE');
    setChatItems([]);
  }, []);

  return (
    <div className="min-h-screen bg-zinc-50 font-sans selection:bg-zinc-200">
      {phase === 'SETUP' ? (
        <SetupScreen onStartGame={handleStartGame} />
      ) : (
        <ChatFeed
          players={players}
          chatItems={chatItems}
          status={status}
          roundIndex={roundIndex}
          voteCandidates={voteCandidates}
          onPause={handlePause}
          onResume={handleResume}
          onBroadcast={handleBroadcast}
          onWhisper={handleWhisper}
          onSubmitHumanSpeak={handleSubmitHumanSpeak}
          onSubmitHumanVote={handleSubmitHumanVote}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default App;

