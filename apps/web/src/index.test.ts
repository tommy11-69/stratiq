import { describe, expect, it } from 'vitest';
import { WEB_MODULE_NAME } from './index.js';

describe('@stratiq/web smoke tests', () => {
  it('exports web module name', () => {
    expect(WEB_MODULE_NAME).toBe('@stratiq/web');
  });
});
