import { describe, expect, it } from 'vitest';
import { EVAL_MODULE_NAME } from './index.js';

describe('@stratiq/eval smoke tests', () => {
  it('exports eval module name', () => {
    expect(EVAL_MODULE_NAME).toBe('@stratiq/eval');
  });
});
