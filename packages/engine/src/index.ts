/**
 * @stratiq/engine
 * Pure deterministic engine.
 * Hard constraints: Zero I/O, zero network, zero clock (Date), zero randomness, zero model imports.
 */

export const ENGINE_MODULE_NAME = '@stratiq/engine';

/**
 * Baseline engine ping demonstrating pure function execution.
 */
export function engineVersion(): string {
  return '0.1.0';
}
