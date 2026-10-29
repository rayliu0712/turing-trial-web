import React, { useState } from 'react';
import { Dices, Play, Plus, Trash2, UserCheck, ShieldAlert, KeyRound, Globe, Sparkles } from 'lucide-react';
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
  // 全域預設配置 (供快速套用全員)
  const [globalBaseUrl, setGlobalBaseUrl] = useState('https://openrouter.ai/api/v1');
  const [globalApiKey, setGlobalApiKey] = useState('');
  const [globalModel, setGlobalModel] = useState('google/gemini-2.5-flash');

  const [hasHuman, setHasHuman] = useState(false);
  const [humanName, setHumanName] = useState(() => generateRandomTaiwaneseName());
  const [humanBio, setHumanBio] = useState('一般平民，剛逃難至此。');

  const [doubleVote, setDoubleVote] = useState(true);

  // 初始 4 位 LLM 玩家
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

  // 重新擲骰單一 LLM 姓名
  const handleRerollName = (index: number) => {
    const existing = new Set(llmPlayers.map((p) => p.name));
    if (hasHuman) existing.add(humanName);
    const newName = generateRandomTaiwaneseName(existing);
    setLlmPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name: newName } : p)),
    );
  };

  // 重新擲骰全體姓名
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

  // 一鍵套用共用連線設定到所有 LLM
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

    // 若人類參賽，加入真人受驗者
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

    // 加入所有 LLM 受驗者
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
    <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      {/* 標題與世界觀簡介 */}
      <div className="border-b border-zinc-200 pb-6">
        <div className="flex items-center gap-2 text-zinc-500 text-xs font-mono uppercase tracking-widest mb-1">
          <ShieldAlert className="w-4 h-4 text-zinc-900" />
          Underground Shelter Protocol // 2050
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
          圖靈審判 (Turing Trial)
        </h1>
        <p className="text-zinc-600 text-sm mt-2 leading-relaxed">
          在隔絕密室中，透過言語互相刺探。每一輪透過投票淘汰最像 AI 的受驗者，最高票者將被抹殺。
        </p>
      </div>

      {/* 快速批次連線設定 (Stub 來源) */}
      <div className="p-5 bg-white border border-zinc-200 rounded-xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-zinc-700" />
            <h2 className="text-sm font-semibold text-zinc-900">OpenAI-Compatible 批次連線設定</h2>
          </div>
          <button
            type="button"
            onClick={handleApplyGlobalConfig}
            className="text-xs bg-zinc-900 hover:bg-zinc-800 text-white font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
          >
            同步套用至全員
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">Base URL (Stub)</label>
            <input
              type="text"
              value={globalBaseUrl}
              onChange={(e) => setGlobalBaseUrl(e.target.value)}
              placeholder="https://api.openai.com/v1"
              className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">API Key</label>
            <div className="relative">
              <input
                type="password"
                value={globalApiKey}
                onChange={(e) => setGlobalApiKey(e.target.value)}
                placeholder="sk-..."
                className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
              />
              <KeyRound className="w-3.5 h-3.5 text-zinc-400 absolute right-3 top-2.5" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-600 mb-1">預設 Model</label>
            <input
              type="text"
              value={globalModel}
              onChange={(e) => setGlobalModel(e.target.value)}
              placeholder="gpt-4o-mini"
              className="w-full text-xs font-mono px-3 py-2 border border-zinc-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-zinc-900 bg-zinc-50"
            />
          </div>
        </div>
      </div>

      {/* 審判規則與人類角色切換 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 二次審判開關 */}
        <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={doubleVote}
              onChange={(e) => setDoubleVote(e.target.checked)}
              className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
            />
            <div>
              <span className="text-sm font-semibold text-zinc-900">啟用「二次審判」機制</span>
              <p className="text-xs text-zinc-500 mt-0.5">
                {doubleVote
                  ? '流程：全員發言 → 提名投票 → 最高票者狡辯/辯解 → 處決投票 → 抹殺。'
                  : '停用二次審判：全員發言完畢後直接進行最終處決投票（跳過辯解環節）。'}
              </p>
            </div>
          </label>
        </div>

        {/* 人類是否參賽 */}
        <div className="p-4 bg-white border border-zinc-200 rounded-xl space-y-2">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={hasHuman}
              onChange={(e) => setHasHuman(e.target.checked)}
              className="w-4 h-4 text-zinc-900 rounded border-zinc-300 focus:ring-zinc-900"
            />
            <div>
              <span className="text-sm font-semibold text-zinc-900 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-zinc-700" />
                我親自作為受驗者參賽（真人玩家）
              </span>
              <p className="text-xs text-zinc-500 mt-0.5">
                {hasHuman
                  ? '你將身為密室受驗者之一，親自參與發言與投票，同時保有上帝特權。'
                  : '純上帝視角模式：人類僅作為旁觀監督者，密室內全員為 LLM。'}
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* 人類受驗者資訊 (若啟用) */}
      {hasHuman && (
        <div className="p-5 bg-zinc-900 text-white rounded-xl shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <h3 className="text-sm font-semibold">你的受驗者身份</h3>
            </div>
            <button
              type="button"
              onClick={() => setHumanName(generateRandomTaiwaneseName())}
              className="flex items-center gap-1 text-xs text-zinc-300 hover:text-white bg-zinc-800 px-2.5 py-1 rounded-md transition-colors cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              重新擲骰姓名
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">受驗者真實姓名</label>
              <input
                type="text"
                value={humanName}
                onChange={(e) => setHumanName(e.target.value)}
                className="w-full text-sm font-bold bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs text-zinc-400 mb-1">背景小傳 / 角色設定 (選填)</label>
              <input
                type="text"
                value={humanBio}
                onChange={(e) => setHumanBio(e.target.value)}
                placeholder="例如：原台北地下街維修工，說話沉穩帶點台灣腔..."
                className="w-full text-xs bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* 受驗者名單 (LLM Players) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-900 flex items-center gap-2">
              受驗者陣列 ({llmPlayers.length + (hasHuman ? 1 : 0)} 名受驗者)
            </h2>
            <p className="text-xs text-zinc-500">
              所有受驗者皆指派台灣真實人名與專屬識別色。支援獨立端點與自介。
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRerollAll}
              className="flex items-center gap-1.5 text-xs border border-zinc-200 hover:bg-zinc-100 text-zinc-700 font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Dices className="w-3.5 h-3.5" />
              全體擲骰姓名
            </button>
            <button
              type="button"
              onClick={handleAddPlayer}
              disabled={llmPlayers.length >= 8}
              className="flex items-center gap-1.5 text-xs bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              增加受驗者
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {llmPlayers.map((player, idx) => {
            const color = getPlayerColor(hasHuman ? idx + 1 : idx);

            return (
              <div
                key={player.id}
                className="p-4 bg-white border border-zinc-200 rounded-xl space-y-3 relative hover:shadow-xs transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${color.avatar}`} />
                    <span className={`text-xs px-2 py-0.5 rounded-md font-semibold ${color.badge}`}>
                      {color.name}
                    </span>
                    <span className="text-xs font-mono text-zinc-400">#{idx + 1}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title="擲骰換名字"
                      onClick={() => handleRerollName(idx)}
                      className="p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors cursor-pointer"
                    >
                      <Dices className="w-4 h-4" />
                    </button>
                    {llmPlayers.length > 2 && (
                      <button
                        type="button"
                        title="移除受驗者"
                        onClick={() => handleRemovePlayer(idx)}
                        className="p-1.5 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                      受驗者姓名
                    </label>
                    <input
                      type="text"
                      value={player.name}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, name: e.target.value } : p)),
                        )
                      }
                      className="w-full text-xs font-bold px-2.5 py-1.5 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                      模型名稱 (Model)
                    </label>
                    <input
                      type="text"
                      value={player.modelName}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, modelName: e.target.value } : p)),
                        )
                      }
                      placeholder="gpt-4o-mini"
                      className="w-full text-xs font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                      Base URL (Stub)
                    </label>
                    <input
                      type="text"
                      value={player.baseUrl}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, baseUrl: e.target.value } : p)),
                        )
                      }
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 bg-zinc-50"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                      API Key
                    </label>
                    <input
                      type="password"
                      value={player.apiKey}
                      onChange={(e) =>
                        setLlmPlayers((prev) =>
                          prev.map((p, i) => (i === idx ? { ...p, apiKey: e.target.value } : p)),
                        )
                      }
                      placeholder="留空沿用共用或手動設定"
                      className="w-full text-[11px] font-mono px-2.5 py-1.5 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 bg-zinc-50"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-500 mb-0.5">
                    自介 / 偽裝背景 (選填)
                  </label>
                  <input
                    type="text"
                    value={player.bio}
                    onChange={(e) =>
                      setLlmPlayers((prev) =>
                        prev.map((p, i) => (i === idx ? { ...p, bio: e.target.value } : p)),
                      )
                    }
                    placeholder="例如：原新竹工程師，說話略帶防備，有強烈求生欲..."
                    className="w-full text-[11px] px-2.5 py-1.5 border border-zinc-200 rounded-lg focus:ring-1 focus:ring-zinc-900 text-zinc-600"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 底部啟動按鈕 */}
      <div className="pt-4 flex items-center justify-between border-t border-zinc-200">
        <div className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          準備就緒：開局後人類可隨時暫停串流、全場廣播、或指名耳語。
        </div>

        <button
          type="button"
          onClick={handleStart}
          className="flex items-center gap-2 bg-zinc-900 hover:bg-black text-white font-bold px-6 py-3 rounded-xl shadow-md transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        >
          <Play className="w-4 h-4 fill-white" />
          啟動圖靈審判
        </button>
      </div>
    </div>
  );
};

