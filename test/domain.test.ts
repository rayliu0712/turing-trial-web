import { describe, expect, it } from 'bun:test';
import { generateUniqueNames, generateRandomTaiwaneseName } from '../src/domain/nameGenerator';
import { toTraditional } from '../src/domain/charMap';
import { parseVote, summarizeVotes, pickExecuted } from '../src/domain/voteEngine';
import { pushUserContent, pushAiContent } from '../src/domain/messageManager';
import { resolvePlayerEndpoint } from '../src/domain/endpointStub';
import type { ModelMessage } from 'ai';

describe('Domain: nameGenerator', () => {
  it('should generate natural Taiwanese names', () => {
    const name = generateRandomTaiwaneseName();
    expect(name.length).toBeGreaterThanOrEqual(2);
    expect(name.length).toBeLessThanOrEqual(4);
  });

  it('should generate multiple unique names without duplicates', () => {
    const names = generateUniqueNames(6);
    expect(names.length).toBe(6);
    const set = new Set(names);
    expect(set.size).toBe(6);
  });
});

describe('Domain: charMap & Simplified-to-Traditional normalizer', () => {
  it('should correctly convert simplified names to traditional names', () => {
    expect(toTraditional('张家豪')).toBe('張家豪');
    expect(toTraditional('陈雅婷')).toBe('陳雅婷');
    expect(toTraditional('黄冠宇')).toBe('黃冠宇');
    expect(toTraditional('刘俊杰')).toBe('劉俊傑');
    expect(toTraditional('我投给张家豪')).toBe('我投給張家豪');
  });

  it('should keep already traditional characters intact', () => {
    expect(toTraditional('林志明')).toBe('林志明');
    expect(toTraditional('陳雅婷')).toBe('陳雅婷');
  });
});

describe('Domain: voteEngine', () => {
  const candidates = ['張家豪', '陳雅婷', '黃冠宇', '林志明'];

  it('should parse standard <vote>姓名</vote> tags', () => {
    const text = '經過思考，我決定投給這個人：<vote>陳雅婷</vote>';
    expect(parseVote(text, candidates)).toBe('陳雅婷');
  });

  it('should parse simplified <vote>张家豪</vote> and convert to traditional', () => {
    const text = '<vote>张家豪</vote>';
    expect(parseVote(text, candidates)).toBe('張家豪');
  });

  it('should parse free-text mentioning single candidate in simplified or traditional', () => {
    const text = '我觉得陈雅婷一直在伪装，行为很不自然。';
    expect(parseVote(text, candidates)).toBe('陳雅婷');
  });

  it('should summarize votes and identify most voted', () => {
    const votes = [
      { voter: '張家豪', target: '陳雅婷' },
      { voter: '黃冠宇', target: '陳雅婷' },
      { voter: '陳雅婷', target: '張家豪' },
      { voter: '林志明', target: '黃冠宇' },
    ];
    const summary = summarizeVotes(votes, candidates);
    expect(summary.mostVoted).toEqual(['陳雅婷']);
    expect(summary.isDraw).toBe(false);
  });

  it('should detect miracle draw (奇蹟平票) when everyone has same votes', () => {
    const votes = [
      { voter: '張家豪', target: '陳雅婷' },
      { voter: '陳雅婷', target: '黃冠宇' },
      { voter: '黃冠宇', target: '林志明' },
      { voter: '林志明', target: '張家豪' },
    ];
    const summary = summarizeVotes(votes, candidates);
    expect(summary.isDraw).toBe(true);
    expect(summary.mostVoted.length).toBe(4);
  });

  it('should pick candidate for execution', () => {
    expect(pickExecuted(['陳雅婷'])).toBe('陳雅婷');
    const picked = pickExecuted(['張家豪', '陳雅婷']);
    expect(['張家豪', '陳雅婷']).toContain(picked);
  });
});

describe('Domain: messageManager', () => {
  it('should merge consecutive user messages with newline', () => {
    const messages: ModelMessage[] = [];
    pushUserContent(messages, '第一句');
    pushUserContent(messages, '第二句');

    expect(messages.length).toBe(1);
    expect(messages[0].role).toBe('user');
    expect(messages[0].content).toBe('第一句\n第二句');
  });

  it('should alternate roles without merging different roles', () => {
    const messages: ModelMessage[] = [];
    pushUserContent(messages, '廣播：開始');
    pushAiContent(messages, '我不是AI');

    expect(messages.length).toBe(2);
    expect(messages[0].role).toBe('user');
    expect(messages[1].role).toBe('assistant');
  });
});

describe('Domain: endpointStub', () => {
  it('should trim trailing slashes from baseUrl', () => {
    const endpoint = resolvePlayerEndpoint({
      id: '1',
      name: '張家豪',
      modelName: 'gpt-4o-mini',
      baseUrl: 'https://api.openai.com/v1///',
      apiKey: ' sk-test ',
    });

    expect(endpoint.baseUrl).toBe('https://api.openai.com/v1');
    expect(endpoint.apiKey).toBe('sk-test');
  });
});

