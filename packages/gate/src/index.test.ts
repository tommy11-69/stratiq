import { describe, expect, it } from 'vitest';
import { GATE_MODULE_NAME } from './index.js';

describe('@stratiq/gate smoke tests', () => {
  it('exports gate module name', () => {
    expect(GATE_MODULE_NAME).toBe('@stratiq/gate');
  });
});
