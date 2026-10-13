import { describe, expect, it } from 'vitest';
import { ENGINE_MODULE_NAME, engineVersion } from './index.js';

describe('@stratiq/engine smoke tests', () => {
  it('exports pure engine module name and version', () => {
    expect(ENGINE_MODULE_NAME).toBe('@stratiq/engine');
    expect(engineVersion()).toBe('0.1.0');
  });

  it('runs deterministically without side effects', () => {
    const res1 = engineVersion();
    const res2 = engineVersion();
    expect(res1).toBe(res2);
  });
});
