import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderCacheTtlLine } from '../dist/render/lines/cache-ttl.js';

function stripAnsi(str) {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;]*m/g, '');
}

function baseContext(overrides = {}) {
  return {
    stdin: {},
    transcript: { tools: [], agents: [], todos: [], ...overrides },
    claudeMdCount: 0,
    rulesCount: 0,
    mcpCount: 0,
    hooksCount: 0,
    sessionDuration: '',
    gitStatus: null,
    usageData: null,
    memoryUsage: null,
    config: {
      lineLayout: 'expanded',
      showSeparators: false,
      pathLevels: 1,
      elementOrder: ['cache'],
      gitStatus: { enabled: false, showDirty: false, showAheadBehind: false, showFileStats: false, pushWarningThreshold: 0, pushCriticalThreshold: 0 },
      display: { showCacheTtl: true, cacheTtlSeconds: 300 },
      colors: {},
    },
    extraLabel: null,
  };
}

test('cache-ttl: returns null when no lastAssistantTimestamp', () => {
  const ctx = baseContext();
  assert.equal(renderCacheTtlLine(ctx), null);
});

test('cache-ttl: shows green countdown when cache is active', () => {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: twoMinutesAgo });
  const result = renderCacheTtlLine(ctx);
  assert.ok(result !== null);
  const text = stripAnsi(result);
  assert.match(text, /Cache ⏱ \dm \d{2}s/);
  // Should be green (remaining > 60s)
  assert.ok(result.includes('\x1b[32m'), 'Expected green color');
});

test('cache-ttl: shows yellow when < 60s remaining', () => {
  const fourMinFiftyAgo = new Date(Date.now() - (4 * 60 + 50) * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: fourMinFiftyAgo });
  const result = renderCacheTtlLine(ctx);
  assert.ok(result !== null);
  // Should be yellow
  assert.ok(result.includes('\x1b[33m'), 'Expected yellow color');
});

test('cache-ttl: shows expired when TTL exceeded', () => {
  const sixMinutesAgo = new Date(Date.now() - 6 * 60 * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: sixMinutesAgo });
  const result = renderCacheTtlLine(ctx);
  assert.ok(result !== null);
  const text = stripAnsi(result);
  assert.match(text, /Cache ⏱ expired/);
  // Should be dim
  assert.ok(result.includes('\x1b[2m'), 'Expected dim color');
});

test('cache-ttl: respects custom cacheTtlSeconds', () => {
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: twoMinutesAgo });
  // Set TTL to 1 minute — should be expired
  ctx.config.display.cacheTtlSeconds = 60;
  const result = renderCacheTtlLine(ctx);
  assert.ok(result !== null);
  const text = stripAnsi(result);
  assert.match(text, /Cache ⏱ expired/);
});

test('cache-ttl: returns null when showCacheTtl is false', () => {
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: oneMinuteAgo });
  ctx.config.display.showCacheTtl = false;
  assert.equal(renderCacheTtlLine(ctx), null);
});

test('cache-ttl: 3600s TTL for Max plan users', () => {
  const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000);
  const ctx = baseContext({ lastAssistantTimestamp: thirtyMinAgo });
  ctx.config.display.cacheTtlSeconds = 3600;
  const result = renderCacheTtlLine(ctx);
  assert.ok(result !== null);
  const text = stripAnsi(result);
  // Should show ~30m remaining, green
  assert.match(text, /Cache ⏱ \d+m \d{2}s/);
  assert.ok(result.includes('\x1b[32m'), 'Expected green color');
});
