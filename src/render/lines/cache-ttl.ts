import type { RenderContext } from '../../types.js';
import { green, yellow, dim } from '../colors.js';

export function renderCacheTtlLine(ctx: RenderContext): string | null {
  const display = ctx.config?.display;
  if (display?.showCacheTtl === false) {
    return null;
  }

  const lastTs = ctx.transcript.lastAssistantTimestamp;
  if (!lastTs) {
    return null;
  }

  const cacheTtlMs = ((display?.cacheTtlSeconds ?? 300) * 1000);
  const elapsed = Date.now() - lastTs.getTime();
  const remaining = cacheTtlMs - elapsed;

  if (remaining <= 0) {
    return dim('Cache ⏱ expired');
  }

  const totalSeconds = Math.ceil(remaining / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const formatted = `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  const text = `Cache ⏱ ${formatted}`;

  if (totalSeconds <= 60) {
    return yellow(text);
  }

  return green(text);
}
