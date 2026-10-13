import { describe, expect, it } from 'vitest';
import { REGISTRY_MODULE_NAME } from './index.js';

describe('@stratiq/registry smoke tests', () => {
  it('exports registry module name', () => {
    expect(REGISTRY_MODULE_NAME).toBe('@stratiq/registry');
  });
});
