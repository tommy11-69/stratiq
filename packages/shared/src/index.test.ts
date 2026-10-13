import { describe, expect, it } from 'vitest';
import { SHARED_MODULE_NAME } from './index.js';

describe('@stratiq/shared', () => {
  it('exports module name', () => {
    expect(SHARED_MODULE_NAME).toBe('@stratiq/shared');
  });
});
