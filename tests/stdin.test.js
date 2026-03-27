import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readStdin, getTotalTokens } from '../dist/stdin.js';

test('readStdin returns null for TTY input', async () => {
  const originalIsTTY = process.stdin.isTTY;
  Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true });

  try {
    const result = await readStdin();
    assert.equal(result, null);
  } finally {
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  }
});

test('readStdin returns null on stream errors', async () => {
  const originalIsTTY = process.stdin.isTTY;
  const originalSetEncoding = process.stdin.setEncoding;
  Object.defineProperty(process.stdin, 'isTTY', { value: false, configurable: true });
  process.stdin.setEncoding = () => {
    throw new Error('boom');
  };

  try {
    const result = await readStdin();
    assert.equal(result, null);
  } finally {
    process.stdin.setEncoding = originalSetEncoding;
    Object.defineProperty(process.stdin, 'isTTY', { value: originalIsTTY, configurable: true });
  }
});

test('getTotalTokens uses total_input_tokens and total_output_tokens when available', () => {
  const stdin = {
    context_window: {
      total_input_tokens: 58857,
      total_output_tokens: 5509,
      current_usage: {
        input_tokens: 0,
        output_tokens: 0,
      },
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 64366);
});

test('getTotalTokens prefers total token fields over current_usage', () => {
  const stdin = {
    context_window: {
      total_input_tokens: 1000,
      total_output_tokens: 500,
      current_usage: {
        input_tokens: 100,
        output_tokens: 50,
      },
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 1500, 'Should use total tokens (1500), not current_usage (150)');
});

test('getTotalTokens falls back to current_usage when total tokens unavailable', () => {
  const stdin = {
    context_window: {
      current_usage: {
        input_tokens: 45000,
        cache_creation_input_tokens: 1000,
        cache_read_input_tokens: 500,
      },
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 46500);
});

test('getTotalTokens returns 0 when current_usage is null', () => {
  const stdin = {
    context_window: {
      current_usage: null,
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 0);
});

test('getTotalTokens returns 0 when current_usage is undefined', () => {
  const stdin = {
    context_window: {},
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 0);
});

test('getTotalTokens handles only total_input_tokens present', () => {
  const stdin = {
    context_window: {
      total_input_tokens: 1000,
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 1000);
});

test('getTotalTokens handles only total_output_tokens present', () => {
  const stdin = {
    context_window: {
      total_output_tokens: 500,
    },
  };

  const result = getTotalTokens(stdin);
  assert.equal(result, 500);
});

test('getTotalTokens returns 0 when context_window is undefined', () => {
  const stdin = {};

  const result = getTotalTokens(stdin);
  assert.equal(result, 0);
});
