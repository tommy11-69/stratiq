import { describe, expect, it } from 'vitest';
import { SERVER_MODULE_NAME } from './index.js';

describe('@stratiq/server smoke tests', () => {
  it('exports server module name', () => {
    expect(SERVER_MODULE_NAME).toBe('@stratiq/server');
  });
});
