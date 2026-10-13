import { describe, expect, it } from 'vitest';
import { MODEL_MODULE_NAME } from './index.js';

describe('@stratiq/model smoke tests', () => {
  it('exports model module name', () => {
    expect(MODEL_MODULE_NAME).toBe('@stratiq/model');
  });
});
