import React, { useState } from 'react';
import { Dices, Plus, Trash2 } from 'lucide-react';
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
  isCustom?: boolean;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({ onStartGame }) => {
  const [globalBaseUrl, setGlobalBaseUrl] = useState('');
  const [globalApiKey, setGlobalApiKey] = useState('');

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
      modelName: '',
      baseUrl: '',
      apiKey: '',
      isHuman: false,
      isCustom: false,
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
        modelName: '',
        baseUrl: '',
        apiKey: '',
        isHuman: false,
        isCustom: false,
      },
    ]);
  };

  const handleRemovePlayer = (index: number) => {
    if (llmPlayers.length <= 2) return;
    setLlmPlayers((prev) => prev.filter((_, i) => i !== index));
  };

  const toggleCustom = (index: number) => {
    setLlmPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, isCustom: !p.isCustom } : p)),
    );
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
      // 若同步，使用全域端點；若自訂，使用獨立端點 (若未填則 fallback 全域)
      const effectiveBaseUrl = p.isCustom
        ? (p.baseUrl.trim() || globalBaseUrl.trim())
        : globalBaseUrl.trim();
      const effectiveApiKey = p.isCustom
        ? (p.apiKey.trim() || globalApiKey.trim())
        : globalApiKey.trim();

      finalPlayers.push({
        id: p.id,
        name: p.name.trim() || `受驗者-${p.id}`,
        bio: p.bio.trim(),
        isHuman: false,
        color: getPlayerColor(colorIndex++),
        modelName: p.modelName.trim(),
        baseUrl: effectiveBaseUrl,
        apiKey: effectiveApiKey,
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
    <div className="max-w-3xl mx-auto p-4 sm:p-8 space-y-6">
      {/* 頂部列：無框極簡標題 */}
      <div className="flex items-center justify-between border-b border-zinc-200 pb-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">圖靈審判</h1>
          <p className="text-xs text-zinc-500 mt-0.5">避難所受驗者淘汰試驗</p>
        </div>
        <button
          type="button"
          onClick={handleStart}
          className="bg-zinc-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
        >
          開始審判
        </button>
      </div>

      {/* 連線設定 (去除外層卡片框，僅保留輸入框本身) */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-zinc-800">連線設定</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={globalBaseUrl}
            onChange={(e) => setGlobalBaseUrl(e.target.value)}
            placeholder="Base URL"
            className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors"
          />

          <input
            type="password"
            value={globalApiKey}
            onChange={(e) => setGlobalApiKey(e.target.value)}
            placeholder="API Key"
            className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors"
          />
        </div>
      </div>

      {/* 規則開關 (無框，自然排列) */}
      <div className="flex flex-wrap gap-5 text-xs text-zinc-700 pt-1">
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

      {/* 真人受驗者 (無外框，以細分隔線呼應) */}
      {hasHuman && (
        <div className="space-y-2 pt-3 border-t border-zinc-200/80 animate-in fade-in duration-150">
          <span className="text-xs font-semibold text-zinc-800">真人身份</span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="relative">
              <input
                type="text"
                value={humanName}
                onChange={(e) => setHumanName(e.target.value)}
                placeholder="姓名"
                className="w-full text-xs font-bold pl-3 pr-8 py-2 border border-zinc-200 rounded-lg bg-zinc-50/50 focus:bg-white"
              />
              <button
                type="button"
                onClick={() => setHumanName(generateRandomTaiwaneseName())}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded cursor-pointer"
                title="擲骰姓名"
              >
                <Dices className="w-3.5 h-3.5" />
              </button>
            </div>
            <input
              type="text"
              value={humanBio}
              onChange={(e) => setHumanBio(e.target.value)}
              placeholder="自介 (選填)"
              className="sm:col-span-2 text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50/50 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* 受驗者名單 (Linear 清爽行列表風格，徹底去除外層包框) */}
      <div className="space-y-3 pt-3 border-t border-zinc-200/80">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-zinc-800">
            受驗者 ({llmPlayers.length + (hasHuman ? 1 : 0)})
          </span>
          <button
            type="button"
            onClick={handleAddPlayer}
            disabled={llmPlayers.length >= 8}
            className="p-1 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors disabled:opacity-30 cursor-pointer"
            title="增加受驗者"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* 逐行排列表，去除卡片外框，以髮絲分隔線區分 */}
        <div className="divide-y divide-zinc-100">
          {llmPlayers.map((player, idx) => {
            const color = getPlayerColor(hasHuman ? idx + 1 : idx);

            return (
              <div key={player.id} className="py-2.5 space-y-2">
                <div className="flex items-center gap-2">
                  {/* 玩家色彩識別圓點 */}
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${color.avatar}`} />

                  {/* 姓名輸入 (內嵌骰子 Suffix 按鈕) */}
                  <div className="relative w-28 sm:w-32 shrink-0">
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                        )
                      }
                      placeholder="姓名"
                      className="w-full text-xs font-bold pl-2.5 pr-7 py-1.5 border border-zinc-200 rounded-lg bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => handleRerollName(idx)}
                      className="absolute right-1 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-700 rounded transition-colors cursor-pointer"
                      title="擲骰姓名"
                    >
                      <Dices className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 模型名稱輸入 */}
                  <input
                    type="text"
                    value={player.modelName}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, modelName: e.target.value } : p)),
                      )
                    }
                    placeholder="Model"
                    className="flex-1 min-w-[120px] text-xs font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-white"
                  />

                  {/* 自介 (桌面版直接並排，手機版折到下方) */}
                  <input
                    type="text"
                    value={player.bio}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, bio: e.target.value } : p)),
                      )
                    }
                    placeholder="自介 (選填)"
                    className="hidden sm:block flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg text-zinc-600 bg-white"
                  />

                  {/* 行操作按鈕組 */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => toggleCustom(idx)}
                      className={`h-7 px-2 rounded-md text-[11px] font-medium transition-colors cursor-pointer flex items-center ${
                        player.isCustom
                          ? 'text-zinc-900 bg-zinc-100 hover:bg-zinc-200'
                          : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
                      }`}
                      title={
                        player.isCustom
                          ? '已解除同步（自訂獨立端點，點擊以恢復同步）'
                          : '同步全域設定中（點擊以解除同步並自訂端點）'
                      }
                    >
                      {player.isCustom ? '自訂連線' : '預設連線'}
                    </button>

                    {llmPlayers.length > 2 && (
                      <button
                        type="button"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded cursor-pointer"
                        title="移除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 手機版自介列 */}
                <div className="sm:hidden pl-4">
                  <input
                    type="text"
                    value={player.bio}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, bio: e.target.value } : p)),
                      )
                    }
                    placeholder="自介 (選填)"
                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg text-zinc-600 bg-white"
                  />
                </div>

                {/* 解除同步時展開獨立端點設定 */}
                {player.isCustom && (
                  <div className="pl-4 grid grid-cols-2 gap-2 pt-1 animate-in fade-in duration-100 min-w-0">
                    <input
                      type="text"
                      value={player.baseUrl}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, baseUrl: e.target.value } : p)),
                        )
                      }
                      placeholder="獨立 Base URL"
                      className="w-full min-w-0 text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    />
                    <input
                      type="password"
                      value={player.apiKey}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, apiKey: e.target.value } : p)),
                        )
                      }
                      placeholder="獨立 API Key"
                      className="w-full min-w-0 text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
