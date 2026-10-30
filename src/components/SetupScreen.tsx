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
  const [initialNames] = useState(() => generateUniqueNames(9));
  const [humanName, setHumanName] = useState(() => initialNames[0]);
  const [humanBio, setHumanBio] = useState('');

  const [doubleVote, setDoubleVote] = useState(true);

  const [llmPlayers, setLlmPlayers] = useState<PlayerDraft[]>(() => {
    return initialNames.slice(1, 5).map((name, i) => ({
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

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // 統計所有當前使用中的姓名次數（真人若啟用則計入，空白不計入）
  const activeNames = [
    ...(hasHuman && humanName.trim() ? [humanName.trim()] : []),
    ...llmPlayers.map((p) => p.name.trim()).filter(Boolean),
  ];

  const nameCounts = activeNames.reduce<Record<string, number>>((acc, name) => {
    acc[name] = (acc[name] || 0) + 1;
    return acc;
  }, {});

  // 檢查所有必填與格式合法性
  const isGlobalBaseUrlValid = !!globalBaseUrl.trim();
  const isGlobalApiKeyValid = !!globalApiKey.trim();
  const isHumanNameValid =
    !hasHuman || (!!humanName.trim() && (nameCounts[humanName.trim()] || 0) <= 1);

  const arePlayersValid = llmPlayers.every((p) => {
    const trimmed = p.name.trim();
    const isNameValid = !!trimmed && (nameCounts[trimmed] || 0) <= 1;
    const isModelValid = !!p.modelName.trim();
    const isCustomValid = !p.isCustom || (!!p.baseUrl.trim() && !!p.apiKey.trim());
    return isNameValid && isModelValid && isCustomValid;
  });

  const isFormValid =
    isGlobalBaseUrlValid && isGlobalApiKeyValid && isHumanNameValid && arePlayersValid;

  const handleToggleHuman = (checked: boolean) => {
    setHasHuman(checked);
    if (checked) {
      const existing = new Set(llmPlayers.map((p) => p.name.trim()).filter(Boolean));
      if (existing.has(humanName.trim()) || !humanName.trim()) {
        setHumanName(generateRandomTaiwaneseName(existing));
      }
    }
  };

  const handleRerollHumanName = () => {
    const existing = new Set<string>();
    if (humanName.trim()) existing.add(humanName.trim());
    llmPlayers.forEach((p) => {
      const trimmed = p.name.trim();
      if (trimmed) existing.add(trimmed);
    });
    setHumanName(generateRandomTaiwaneseName(existing));
  };

  const handleRerollName = (index: number) => {
    const existing = new Set<string>();
    if (hasHuman && humanName.trim()) {
      existing.add(humanName.trim());
    }
    llmPlayers.forEach((p) => {
      const trimmed = p.name.trim();
      if (trimmed) existing.add(trimmed);
    });
    const newName = generateRandomTaiwaneseName(existing);
    setLlmPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name: newName } : p)),
    );
  };

  const handleAddPlayer = () => {
    if (llmPlayers.length >= 8) return;
    const existing = new Set<string>();
    if (hasHuman && humanName.trim()) {
      existing.add(humanName.trim());
    }
    llmPlayers.forEach((p) => {
      const trimmed = p.name.trim();
      if (trimmed) existing.add(trimmed);
    });
    const name = generateRandomTaiwaneseName(existing);
    setLlmPlayers((prev) => [
      ...prev,
      {
        id: `llm-${Date.now()}-${prev.length + 1}`,
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
    if (!isFormValid) {
      setHasAttemptedSubmit(true);
      return;
    }

    const finalPlayers: Player[] = [];
    let colorIndex = 0;

    if (hasHuman) {
      finalPlayers.push({
        id: 'player-human',
        name: humanName.trim(),
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
            content: buildSystemPrompt(humanName.trim(), humanBio.trim()),
          },
        ],
      });
    }

    llmPlayers.forEach((p) => {
      const effectiveBaseUrl = p.isCustom
        ? p.baseUrl.trim()
        : globalBaseUrl.trim();
      const effectiveApiKey = p.isCustom
        ? p.apiKey.trim()
        : globalApiKey.trim();

      finalPlayers.push({
        id: p.id,
        name: p.name.trim(),
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
            content: buildSystemPrompt(p.name.trim(), p.bio.trim()),
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
        <div className="flex items-center gap-3">
          {hasAttemptedSubmit && !isFormValid && (
            <span className="text-xs text-rose-600 font-medium animate-in fade-in duration-150">
              請修正標記紅色的欄位
            </span>
          )}
          <button
            type="button"
            onClick={handleStart}
            className="bg-zinc-900 hover:bg-black text-white text-xs font-semibold px-4 py-2 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            開始審判
          </button>
        </div>
      </div>

      {/* 連線設定 (去除外層卡片框，僅保留輸入框本身) */}
      <div className="space-y-2">
        <h2 className="text-xs font-semibold text-zinc-800">全域 API</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={globalBaseUrl}
            onChange={(e) => setGlobalBaseUrl(e.target.value)}
            placeholder="Base URL"
            className={`w-full text-xs font-mono px-3 py-2 border rounded-lg transition-colors ${
              hasAttemptedSubmit && !globalBaseUrl.trim()
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                : 'border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
            }`}
            title={hasAttemptedSubmit && !globalBaseUrl.trim() ? '請填寫全域 Base URL' : undefined}
          />

          <input
            type="password"
            value={globalApiKey}
            onChange={(e) => setGlobalApiKey(e.target.value)}
            placeholder="API Key"
            className={`w-full text-xs font-mono px-3 py-2 border rounded-lg transition-colors ${
              hasAttemptedSubmit && !globalApiKey.trim()
                ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                : 'border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
            }`}
            title={hasAttemptedSubmit && !globalApiKey.trim() ? '請填寫全域 API Key' : undefined}
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
            onChange={(e) => handleToggleHuman(e.target.checked)}
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
                className={`w-full text-xs font-bold pl-3 pr-8 py-2 border rounded-lg transition-colors ${
                  (hasAttemptedSubmit && !humanName.trim()) ||
                  (humanName.trim() !== '' && (nameCounts[humanName.trim()] || 0) > 1)
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                    : 'border-zinc-200 bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
                }`}
                title={
                  humanName.trim() !== '' && (nameCounts[humanName.trim()] || 0) > 1
                    ? '姓名不可與其他受驗者重複'
                    : hasAttemptedSubmit && !humanName.trim()
                    ? '請輸入姓名'
                    : undefined
                }
              />
              <button
                type="button"
                onClick={handleRerollHumanName}
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
              className="sm:col-span-2 text-xs px-3 py-2 border border-zinc-200 rounded-lg bg-zinc-50/50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors"
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
            const trimmedName = player.name.trim();
            const isNameDuplicate = trimmedName !== '' && (nameCounts[trimmedName] || 0) > 1;
            const isNameEmpty = !trimmedName;
            const nameHasError = (hasAttemptedSubmit && isNameEmpty) || isNameDuplicate;

            const modelHasError = hasAttemptedSubmit && !player.modelName.trim();
            const customBaseUrlHasError =
              player.isCustom && hasAttemptedSubmit && !player.baseUrl.trim();
            const customApiKeyHasError =
              player.isCustom && hasAttemptedSubmit && !player.apiKey.trim();

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
                      className={`w-full text-xs font-bold pl-2.5 pr-7 py-1.5 border rounded-lg transition-colors ${
                        nameHasError
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                          : 'border-zinc-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
                      }`}
                      title={
                        isNameDuplicate
                          ? '姓名不可與其他受驗者重複'
                          : nameHasError
                          ? '請輸入姓名'
                          : undefined
                      }
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
                    className={`flex-1 min-w-[120px] text-xs font-mono px-2.5 py-1.5 border rounded-lg transition-colors ${
                      modelHasError
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                        : 'border-zinc-200 bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
                    }`}
                    title={modelHasError ? '請輸入 Model 名稱' : undefined}
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
                    className="hidden sm:block flex-1 text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg text-zinc-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors"
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
                      {player.isCustom ? '自訂 API' : '全域 API'}
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
                    className="w-full text-xs px-2.5 py-1.5 border border-zinc-200 rounded-lg text-zinc-600 bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900 transition-colors"
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
                      placeholder="Base URL"
                      className={`w-full min-w-0 text-[11px] font-mono px-2.5 py-1.5 border rounded-lg transition-colors ${
                        customBaseUrlHasError
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                          : 'border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
                      }`}
                      title={customBaseUrlHasError ? '自訂 API 時請填寫 Base URL' : undefined}
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
                      className={`w-full min-w-0 text-[11px] font-mono px-2.5 py-1.5 border rounded-lg transition-colors ${
                        customApiKeyHasError
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 bg-rose-50/30 text-rose-950 placeholder:text-rose-300'
                          : 'border-zinc-200 bg-zinc-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-zinc-900'
                      }`}
                      title={customApiKeyHasError ? '自訂 API 時請填寫 API Key' : undefined}
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
