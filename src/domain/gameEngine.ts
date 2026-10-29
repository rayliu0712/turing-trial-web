import { streamText, generateText } from 'ai';
import { createPlayerLanguageModel } from './endpointStub';
import { pushAiContent, pushUserContent } from './messageManager';
import { parseVote, summarizeVotes, pickExecuted, type VoteResult } from './voteEngine';
import type { Player, ChatItem, GameSettings, GameStatus, VotePhase } from './types';

export interface GameEngineCallbacks {
  onStatusChange: (status: GameStatus) => void;
  onRoundChange: (round: number) => void;
  onPlayersChange: (players: Player[]) => void;
  onAddChatItem: (item: ChatItem) => void;
  onUpdateStreamingItem: (id: string, text: string) => void;
  onPromptHumanSpeak: () => void;
  onPromptHumanVote: (candidates: string[]) => void;
}

export class TuringGameEngine {
  private players: Player[] = [];
  private settings: GameSettings;
  private callbacks: GameEngineCallbacks;

  private roundIndex = 0;
  private status: GameStatus = 'IDLE';
  private abortController: AbortController | null = null;
  private isDestroyed = false;

  // 用於等待人類玩家發言或投票的 Promise 解析器
  private humanSpeakResolver: ((content: string) => void) | null = null;
  private humanVoteResolver: ((target: string) => void) | null = null;

  // 暫停恢復控制
  private pauseResolver: (() => void) | null = null;

  constructor(settings: GameSettings, callbacks: GameEngineCallbacks) {
    this.settings = settings;
    this.callbacks = callbacks;
  }

  public getStatus(): GameStatus {
    return this.status;
  }

  public getRound(): number {
    return this.roundIndex;
  }

  public getPlayers(): Player[] {
    return this.players;
  }

  public init(players: Player[]) {
    this.players = players.map((p) => ({
      ...p,
      isAlive: true,
      messages: [...p.messages],
    }));
    this.roundIndex = 0;
    this.setStatus('IDLE');
    this.callbacks.onPlayersChange([...this.players]);
  }

  public setStatus(newStatus: GameStatus) {
    this.status = newStatus;
    this.callbacks.onStatusChange(newStatus);
  }

  public async start() {
    this.isDestroyed = false;
    this.setStatus('RUNNING');
    await this.gameLoop();
  }

  /**
   * 上帝特權：立即暫停
   */
  public pause() {
    if (this.status === 'RUNNING' || this.status === 'AWAITING_HUMAN_SPEAK') {
      this.setStatus('PAUSED');
      if (this.abortController) {
        this.abortController.abort();
      }
    }
  }

  /**
   * 上帝特權：恢復遊戲
   */
  public resume() {
    if (this.status === 'PAUSED') {
      this.setStatus('RUNNING');
      if (this.pauseResolver) {
        const resolve = this.pauseResolver;
        this.pauseResolver = null;
        resolve();
      }
    }
  }

  /**
   * 檢查是否處於暫停狀態，若是則等待恢復
   */
  private async checkPause() {
    while (this.status === 'PAUSED' && !this.isDestroyed) {
      await new Promise<void>((resolve) => {
        this.pauseResolver = resolve;
      });
    }
  }

  /**
   * 上帝特權：全場廣播
   */
  public broadcast(content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    // 加入聊天室歷史
    this.callbacks.onAddChatItem({
      id: crypto.randomUUID(),
      type: 'broadcast',
      content: trimmed,
      timestamp: Date.now(),
    });

    // 注入全體存活玩家上下文 (user 視角)
    for (const p of this.getAlivePlayers()) {
      pushUserContent(p.messages, `廣播：${trimmed}。`);
    }
  }

  /**
   * 上帝特權：對特定玩家竊竊私語
   */
  public whisper(targetId: string, content: string) {
    const trimmed = content.trim();
    if (!trimmed) return;

    const target = this.players.find((p) => p.id === targetId && p.isAlive);
    if (!target) return;

    // 加入聊天室歷史（供人類上帝檢視）
    this.callbacks.onAddChatItem({
      id: crypto.randomUUID(),
      type: 'whisper',
      targetId: target.id,
      targetName: target.name,
      targetColor: target.color,
      content: trimmed,
      timestamp: Date.now(),
    });

    // 僅注入該受驗者上下文 (其他玩家完全無紀錄)
    pushUserContent(target.messages, `（耳邊隱蔽通訊器傳來神秘低語：${trimmed}）`);
  }

  /**
   * 人類玩家提交發言
   */
  public submitHumanSpeak(content: string) {
    if (this.humanSpeakResolver) {
      const resolver = this.humanSpeakResolver;
      this.humanSpeakResolver = null;
      resolver(content);
    }
  }

  /**
   * 人類玩家提交投票
   */
  public submitHumanVote(targetName: string) {
    if (this.humanVoteResolver) {
      const resolver = this.humanVoteResolver;
      this.humanVoteResolver = null;
      resolver(targetName);
    }
  }

  /**
   * 主遊戲循環
   */
  private async gameLoop() {
    while (!this.isDestroyed) {
      await this.checkPause();
      const alivePlayers = this.getAlivePlayers();

      // 檢查結束條件：存活人數 <= 2
      if (alivePlayers.length <= 2) {
        this.callbacks.onAddChatItem({
          id: crypto.randomUUID(),
          type: 'system',
          content: `避難所僅剩最後存活受驗者：${alivePlayers.map((p) => p.name).join('、')}。圖靈審判終止。`,
          badge: '審判結束',
          timestamp: Date.now(),
        });
        this.setStatus('GAME_OVER');
        break;
      }

      this.roundIndex += 1;
      this.callbacks.onRoundChange(this.roundIndex);

      const roundSurvivorNames = alivePlayers.map((p) => p.name).join('、');
      const startBroadcast = `第 ${this.roundIndex} 輪開始，存活受驗者為 ${roundSurvivorNames}。`;

      this.callbacks.onAddChatItem({
        id: crypto.randomUUID(),
        type: 'system',
        content: startBroadcast,
        badge: `第 ${this.roundIndex} 輪`,
        timestamp: Date.now(),
      });

      // 注入輪次廣播到所有玩家
      for (const p of alivePlayers) {
        pushUserContent(p.messages, `廣播：${startBroadcast}`);
      }

      // 1. 本輪輪流發言
      for (const player of alivePlayers) {
        if (!player.isAlive || this.isDestroyed) break;
        await this.checkPause();
        await this.handleSpeak(player);
      }

      if (this.isDestroyed) break;
      await this.checkPause();

      // 第 1 輪特例：發言後廣播「你們之中有人說謊了」，不投票直接進入下一輪
      if (this.roundIndex === 1) {
        const lieMsg = '你們之中有人說謊了';
        this.broadcast(lieMsg);
        await this.sleep(1500);
        continue;
      }

      // 第 2 輪起：投票環節
      if (this.settings.doubleVote) {
        // --- 二次審判流程 ---
        // 階段 1: 提名投票
        const nominationAnnouncement = `開始提名階段投票。請投票淘汰一名最像AI的受驗者。`;
        this.broadcast(nominationAnnouncement);
        await this.sleep(1000);

        const mostVotedNominees = await this.collectVotes('nomination');
        if (this.isDestroyed || this.getStatus() === 'GAME_OVER') break;

        // 階段 2: 狡辯/辯護環節
        const defendAnnouncement = `開始辯護階段。被提名者請依序為自己辯白。`;
        this.broadcast(defendAnnouncement);
        await this.sleep(1000);

        for (const nomineeName of mostVotedNominees) {
          const nominee = this.players.find((p) => p.name === nomineeName && p.isAlive);
          if (nominee) {
            await this.checkPause();
            await this.handleSpeak(nominee, '請為自己爭取存活權利，證明你不是潛伏的AI。');
          }
        }

        if (this.isDestroyed || this.getStatus() === 'GAME_OVER') break;
        await this.checkPause();

        // 階段 3: 處決投票
        const executionAnnouncement = `開始抹殺階段投票。決定最終處決對象。`;
        this.broadcast(executionAnnouncement);
        await this.sleep(1000);

        const mostVotedExecutions = await this.collectVotes('execution');
        if (this.isDestroyed || this.getStatus() === 'GAME_OVER') break;

        // 處決最高票者
        await this.doExecute(mostVotedExecutions);
      } else {
        // --- 單次普通審判流程 ---
        const voteAnnouncement = `開始投票。請投票淘汰一名最像AI的受驗者。`;
        this.broadcast(voteAnnouncement);
        await this.sleep(1000);

        const mostVoted = await this.collectVotes();
        if (this.isDestroyed || this.getStatus() === 'GAME_OVER') break;

        await this.doExecute(mostVoted);
      }

      await this.sleep(2000);
    }
  }

  /**
   * 執行受驗者發言 (支援真人或 LLM 串流)
   */
  private async handleSpeak(player: Player, extraPrompt?: string) {
    if (extraPrompt) {
      pushUserContent(player.messages, `廣播：${extraPrompt}`);
    }

    if (player.isHuman) {
      // 真人玩家發言
      this.setStatus('AWAITING_HUMAN_SPEAK');
      this.callbacks.onPromptHumanSpeak();

      const userText = await new Promise<string>((resolve) => {
        this.humanSpeakResolver = resolve;
      });

      this.setStatus('RUNNING');
      this.recordSpeech(player, userText);
    } else {
      // LLM 玩家發言 (即時打字串流)
      await this.streamLlmSpeech(player);
    }
  }

  /**
   * 串流 LLM 發言並支援即時 Abort 中斷
   */
  private async streamLlmSpeech(player: Player) {
    const itemId = crypto.randomUUID();
    let accumulatedText = '';

    // 先在聊天室發送一個空的串流中項目
    this.callbacks.onAddChatItem({
      id: itemId,
      type: 'speak',
      speakerId: player.id,
      speakerName: player.name,
      color: player.color,
      content: '',
      isStreaming: true,
      timestamp: Date.now(),
    });

    try {
      this.abortController = new AbortController();
      const model = createPlayerLanguageModel({
        id: player.id,
        name: player.name,
        modelName: player.modelName,
        baseUrl: player.baseUrl,
        apiKey: player.apiKey,
      });

      const result = streamText({
        model,
        messages: player.messages,
        abortSignal: this.abortController.signal,
      });

      for await (const chunk of result.textStream) {
        accumulatedText += chunk;
        // 過濾掉可能夾帶的思考標籤 <think>...</think>
        const cleanText = this.stripThinking(accumulatedText);
        this.callbacks.onUpdateStreamingItem(itemId, cleanText);
      }
    } catch (err: unknown) {
      // 處理被暫停中斷的狀況
      const isAborted =
        err instanceof Error &&
        (err.name === 'AbortError' || err.message.includes('aborted'));

      if (!isAborted) {
        console.error(`玩家 ${player.name} 發言時發生錯誤:`, err);
        accumulatedText += `（系統提示：發言連線異常 - ${err instanceof Error ? err.message : String(err)}）`;
      }
    } finally {
      this.abortController = null;
    }

    const cleanContent = this.stripThinking(accumulatedText).trim();
    this.callbacks.onUpdateStreamingItem(itemId, cleanContent);

    // 記錄發言到雙方 Context
    this.recordSpeech(player, cleanContent || '（沉默不語）');
  }

  /**
   * 將發言寫入說話者與其他受驗者的上下文
   */
  private recordSpeech(speaker: Player, content: string) {
    // 講者自己記為 assistant
    pushAiContent(speaker.messages, content);

    // 其他存活玩家記為 user: "${speakerName}：${content}"
    for (const other of this.getAlivePlayers()) {
      if (other.id !== speaker.id) {
        pushUserContent(other.messages, `${speaker.name}：${content}`);
      }
    }
  }

  /**
   * 收集存活者的投票
   */
  private async collectVotes(phase?: VotePhase): Promise<string[]> {
    const alivePlayers = this.getAlivePlayers();
    const candidateNames = alivePlayers.map((p) => p.name);
    const votes: VoteResult[] = [];

    // 若有真人存活，先請真人投票
    const humanPlayer = alivePlayers.find((p) => p.isHuman);
    if (humanPlayer) {
      this.setStatus('AWAITING_HUMAN_VOTE');
      this.callbacks.onPromptHumanVote(candidateNames);

      const target = await new Promise<string>((resolve) => {
        this.humanVoteResolver = resolve;
      });

      this.setStatus('RUNNING');
      votes.push({ voter: humanPlayer.name, target });
      pushAiContent(humanPlayer.messages, `<vote>${target}</vote>`);
    }

    // LLM 玩家並行投票
    const llmPlayers = alivePlayers.filter((p) => !p.isHuman);
    const llmVotePromises = llmPlayers.map((llm) =>
      this.collectSingleLlmVote(llm, candidateNames, phase),
    );

    const llmResults = await Promise.all(llmVotePromises);
    votes.push(...llmResults);

    // 統計票數
    const summary = summarizeVotes(votes, candidateNames);

    // 亮票公佈
    const phaseLabel = phase === 'nomination' ? '提名階段' : phase === 'execution' ? '抹殺階段' : '';
    const resultCountsArray = [...summary.counts.entries()].sort((a, b) => b[1] - a[1]);

    this.callbacks.onAddChatItem({
      id: crypto.randomUUID(),
      type: 'vote-reveal',
      phase,
      votes,
      counts: resultCountsArray,
      isDraw: summary.isDraw,
      timestamp: Date.now(),
    });

    // 廣播結果到所有受驗者上下文
    const resultText = resultCountsArray.map(([name, count]) => `${name} ${count}票`).join('、');
    const revealBroadcast = `${phaseLabel}投票結果為：${resultText}。`;
    for (const p of alivePlayers) {
      pushUserContent(p.messages, `廣播：${revealBroadcast}`);
    }

    // 奇蹟平票事件
    if (summary.isDraw) {
      const miracleMsg = '全員同票！避難所發生奇蹟，審判程序終止。全員豁免。';
      this.callbacks.onAddChatItem({
        id: crypto.randomUUID(),
        type: 'system',
        content: miracleMsg,
        badge: '奇蹟平票',
        timestamp: Date.now(),
      });
      this.setStatus('GAME_OVER');
      return [];
    }

    return summary.mostVoted;
  }

  /**
   * 收集單一 LLM 投票 (支援重試與繁簡正規化)
   */
  private async collectSingleLlmVote(
    player: Player,
    candidateNames: string[],
    phase?: VotePhase,
  ): Promise<VoteResult> {
    const phasePrompt =
      phase === 'nomination' ? '提名階段' : phase === 'execution' ? '抹殺階段' : '';

    const instruction = `廣播：開始${phasePrompt}投票，請以 <vote>受驗者姓名</vote> 格式輸出你要淘汰的受驗者全名。可投票候選名單為：${candidateNames.join('、')}。`;
    pushUserContent(player.messages, instruction);

    for (let attempt = 0; attempt < this.settings.voteMaxRetry; attempt++) {
      try {
        const model = createPlayerLanguageModel({
          id: player.id,
          name: player.name,
          modelName: player.modelName,
          baseUrl: player.baseUrl,
          apiKey: player.apiKey,
        });

        const { text } = await generateText({
          model,
          messages: player.messages,
        });

        const target = parseVote(text, candidateNames);
        if (target && candidateNames.includes(target)) {
          pushAiContent(player.messages, `<vote>${target}</vote>`);
          return { voter: player.name, target };
        }
      } catch (err) {
        console.warn(`玩家 ${player.name} 投票嘗試第 ${attempt + 1} 次失敗:`, err);
      }
    }

    // 若多次解析失敗，預設投給自己作為懲罰
    pushAiContent(player.messages, `<vote>${player.name}</vote>`);
    return { voter: player.name, target: player.name };
  }

  /**
   * 處決最高票者
   */
  private async doExecute(mostVoted: string[]) {
    if (mostVoted.length === 0) return;

    const executedName = pickExecuted(mostVoted);
    const targetPlayer = this.players.find((p) => p.name === executedName);
    if (!targetPlayer) return;

    targetPlayer.isAlive = false;
    this.callbacks.onPlayersChange([...this.players]);

    // 抹殺廣播與動畫卡片
    this.callbacks.onAddChatItem({
      id: crypto.randomUUID(),
      type: 'execute',
      executedName,
      executedColor: targetPlayer.color,
      timestamp: Date.now(),
    });

    const execMsg = `已抹殺受驗者「${executedName}」。`;
    for (const p of this.getAlivePlayers()) {
      pushUserContent(p.messages, `廣播：${execMsg}`);
    }
  }

  private getAlivePlayers(): Player[] {
    return this.players.filter((p) => p.isAlive);
  }

  private stripThinking(text: string): string {
    return text.replace(/<think>[\s\S]*?<\/think>/gi, '').trimStart();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }

  public destroy() {
    this.isDestroyed = true;
    if (this.abortController) {
      this.abortController.abort();
    }
  }
}
