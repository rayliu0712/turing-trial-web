import React, { useState } from 'react';
import { Dices, Plus, Trash2, KeyRound } from 'lucide-react';
import { generateRandomTaiwaneseName, generateUniqueNames } from '../domain/nameGenerator';
import { getPlayerColor } from '../domain/playerColors';
import { buildSystemPrompt } from '../domain/promptFactory';
import type { Player, GameSettings } from '../domain/types';

interface SetupScreenProps {
  onStartGame: (players: Player[], settings: GameSettings) => void;
}

interface PlayerDraft {
  id: string;
  name: string;
  bio: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
  isHuman: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [globalBaseUrl, setGlobalBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [globalModel, setGlobalModel] = useState('google/gemini-2.5-flash');

  const [hasHuman, setHasHuman] = useState(false);
  const [humanName, setHumanName] = useState(() => generateRandomTaiwaneseName());
  const [humanBio, setHumanBio] = useState('');

  const [doubleVote, setDoubleVote] = useState(true);

  const [llmPlayers, setLlmPlayers] = useState<PlayerDraft[]>(() => {
    const names = generateUniqueNames(4);
    return names.map((name, i) => ({
      id: `llm-${i + 1}`,
      name,
      bio: '',
      modelName: 'google/gemini-2.5-flash',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: '',
      isHuman: false,
    }));
  });

  const handleRerollName = (index: number) => {
    const existing = new Set(llmPlayers.map((p) => p.name));
    if (hasHuman) existing.add(humanName);
    const newName = generateRandomTaiwaneseName(existing);
    setLlmPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name: newName } : p)),
    );
  };

  const handleRerollAll = () => {
    const totalNeeded = llmPlayers.length + (hasHuman ? 1 : 0);
    const names = generateUniqueNames(totalNeeded);
    if (hasHuman) {
      setHumanName(names[0]);
      setLlmPlayers((prev) =>
        prev.map((p, i) => ({ ...p, name: names[i + 1] })),
      );
    } else {
      setLlmPlayers((prev) =>
        prev.map((p, i) => ({ ...p, name: names[i] })),
      );
    }
  };

  const handleApplyGlobalConfig = () => {
    setLlmPlayers((prev) =>
      prev.map((p) => ({
        ...p,
        baseUrl: globalBaseUrl,
        apiKey: globalApiKey || p.apiKey,
        modelName: globalModel,
      })),
    );
  };

  const handleAddPlayer = () => {
    if (llmPlayers.length >= 8) return;
    const existing = new Set(llmPlayers.map((p) => p.name));
    if (hasHuman) existing.add(humanName);
    const name = generateRandomTaiwaneseName(existing);
    setLlmPlayers((prev) => [
      ...prev,
      {
        id: `llm-${prev.length + 1}`,
        name,
        bio: '',
        modelName: globalModel,
        baseUrl: globalBaseUrl,
        apiKey: globalApiKey,
        isHuman: false,
      },
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (llmPlayers.length <= 2) return;
    setLlmPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStart = () => {
    const finalPlayers: Player[] = [];
    let colorIndex = 0;

    if (hasHuman) {
      finalPlayers.push({
        id: 'player-human',
        name: humanName.trim() || '倖存者',
        bio: humanBio.trim(),
        isHuman: true,
        color: getPlayerColor(colorIndex++),
        modelName: 'human',
        baseUrl: '',
        apiKey: '',
        isAlive: true,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(humanName, humanBio),
          },
        ],
      });
    }

    llmPlayers.forEach((p) => {
      finalPlayers.push({
        id: p.id,
        name: p.name.trim() || `受驗者-${p.id}`,
        bio: p.bio.trim(),
        isHuman: false,
        color: getPlayerColor(colorIndex++),
        modelName: p.modelName.trim(),
        baseUrl: p.baseUrl.trim(),
        apiKey: p.apiKey.trim(),
        isAlive: true,
        messages: [
          {
            role: 'system',
            content: buildSystemPrompt(p.name, p.bio),
          },
        ],
      });
    });

    onStartGame(finalPlayers, {
      doubleVote,
      voteMaxRetry: 2,
      hasHumanPlayer: hasHuman,
    });
  };

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
      {/* 頂部列：極簡標題與開始按鈕 */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">圖靈審判</h1>
          <p className="text-xs text-zinc-500">避難所受驗者淘汰試驗</p>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="bg-zinc-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer"
        >
          開始審判
        </button>
      </div>

      {/* 批次連線設定 */}
      <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-900">連線預設</span>
          <button
            type="button"
            onClick={handleApplyGlobalConfig}
            className="text-xs text-zinc-600 hover:text-zinc-900 font-medium px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-50 transition-colors cursor-pointer"
          >
            套用全員
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <input
            type="text"
            value={globalBaseUrl}
            onChange={(e) => setGlobalBaseUrl(e.target.value)}
            placeholder="Base URL"
            className="text-xs font-mono px-3 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white"
          />

          <div className="relative">
            <input
              type="password"
              value={globalApiKey}
              onChange={(e) => setGlobalApiKey(e.target.value)}
              placeholder="API Key"
              className="w-full text-xs font-mono px-3 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white"
            />
            <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-2" />
          </div>

          <input
            type="text"
            value={globalModel}
            onChange={(e) => setGlobalModel(e.target.value)}
            placeholder="Model (例如 gpt-4o-mini)"
            className="text-xs font-mono px-3 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white"
          />
        </div>
      </div>

      {/* 規則開關 */}
      <div className="flex flex-wrap gap-4 text-xs text-zinc-700">
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={doubleVote}
            onChange={(e) => setDoubleVote(e.target.checked)}
            className="w-3.5 h-3.5 text-zinc-900 rounded border-zinc-300"
          />
          <span className="font-medium">二次審判（提名 → 辯解 → 處決）</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={hasHuman}
            onChange={(e) => setHasHuman(e.target.checked)}
            className="w-3.5 h-3.5 text-zinc-900 rounded border-zinc-300"
          />
          <span className="font-medium">真人受驗者參賽</span>
        </label>
      </div>

      {/* 真人受驗者欄位 */}
      {hasHuman && (
        <div className="p-3.5 bg-zinc-900 text-white rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-300">真人身份</span>
            <button
              type="button"
              onClick={() => setHumanName(generateRandomTaiwaneseName())}
              className="p-1 text-zinc-400 hover:text-white rounded cursor-pointer"
              title="擲骰姓名"
            >
              <Dices className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={humanName}
              onChange={(e) => setHumanName(e.target.value)}
              placeholder="姓名"
              className="text-xs font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
            />
            <input
              type="text"
              value={humanBio}
              onChange={(e) => setHumanBio(e.target.value)}
              placeholder="自介 (選填)"
              className="sm:col-span-2 text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-white"
            />
          </div>
        </div>
      )}

      {/* 受驗者陣列 */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-zinc-700">
            受驗者 ({llmPlayers.length + (hasHuman ? 1 : 0)})
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRerollAll}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors cursor-pointer"
              title="全體擲骰姓名"
            >
              <Dices className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={llmPlayers.length >= 8}
              className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-lg transition-colors disabled:opacity-30 cursor-pointer"
              title="增加受驗者"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {llmPlayers.map((player, idx) => {
            const color = getPlayerColor(hasHuman ? idx + 1 : idx);

            return (
              <div
                key={player.id}
                className="p-3 bg-white border border-zinc-200 rounded-xl space-y-2 relative"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${color.avatar}`} />
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-semibold border ${color.badge}`}>
                      {color.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleRerollName(idx)}
                      className="p-1 text-zinc-400 hover:text-zinc-800 rounded cursor-pointer"
                      title="擲骰姓名"
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                    {llmPlayers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-1 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                        title="移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={player.name}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                      )
                    }
                    placeholder="姓名"
                    className="text-xs font-bold px-2.5 py-1.5 border border-zinc-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={player.modelName}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, modelName: e.target.value } : p)),
                      )
                    }
                    placeholder="Model"
                    className="text-xs font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={player.baseUrl}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, baseUrl: e.target.value } : p)),
                      )
                    }
                    placeholder="Base URL"
                    className="text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50"
                  />
                  <input
                    type="password"
                    value={player.apiKey}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, apiKey: e.target.value } : p)),
                      )
                    }
                    placeholder="API Key"
                    className="text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50"
                  />
                </div>

                <input
                  type="text"
                  value={player.bio}
                  onChange={(e) =>
                    setLlmPlayers((prev) =>
                      prev.map((p, i) => (i === idx ? { ...p, bio: e.target.value } : p)),
                    )
                  }
                  placeholder="自介 (選填)"
                  className="w-full text-[11px] px-2.5 py-1.5 border border-zinc-200 rounded-lg text-zinc-600"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
