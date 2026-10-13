import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.next/**',
      '**/coverage/**',
      'source/**',
      '*.pdf',
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts', '**/*.tsx'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Hard Architectural Constraint: packages/engine import & purity boundary
  {
    files: ['packages/engine/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-globals': [
        'error',
        {
          name: 'Date',
          message:
            'Date is forbidden in packages/engine. The deterministic engine must not access the clock; explicit asOfDate must be provided as an input.',
        },
        {
          name: 'fetch',
          message:
            'fetch is forbidden in packages/engine. The deterministic engine must have no I/O or network access.',
        },
        {
          name: 'setTimeout',
          message: 'setTimeout is forbidden in packages/engine.',
        },
        {
          name: 'setInterval',
          message: 'setInterval is forbidden in packages/engine.',
        },
        {
          name: 'setImmediate',
          message: 'setImmediate is forbidden in packages/engine.',
        },
        {
          name: 'XMLHttpRequest',
          message: 'XMLHttpRequest is forbidden in packages/engine.',
        },
        {
          name: 'WebSocket',
          message: 'WebSocket is forbidden in packages/engine.',
        },
      ],
      'no-restricted-imports': [
        'error',
        {
          paths: [
            { name: 'fs', message: 'fs is forbidden in packages/engine. Pure computation only.' },
            { name: 'node:fs', message: 'node:fs is forbidden in packages/engine.' },
            {
              name: 'node:fs/promises',
              message: 'node:fs/promises is forbidden in packages/engine.',
            },
            { name: 'fs/promises', message: 'fs/promises is forbidden in packages/engine.' },
            { name: 'http', message: 'http is forbidden in packages/engine.' },
            { name: 'node:http', message: 'node:http is forbidden in packages/engine.' },
            { name: 'https', message: 'https is forbidden in packages/engine.' },
            { name: 'node:https', message: 'node:https is forbidden in packages/engine.' },
            { name: 'net', message: 'net is forbidden in packages/engine.' },
            { name: 'node:net', message: 'node:net is forbidden in packages/engine.' },
            { name: 'child_process', message: 'child_process is forbidden in packages/engine.' },
            {
              name: 'node:child_process',
              message: 'node:child_process is forbidden in packages/engine.',
            },
            { name: 'cluster', message: 'cluster is forbidden in packages/engine.' },
            { name: 'node:cluster', message: 'node:cluster is forbidden in packages/engine.' },
            { name: 'dgram', message: 'dgram is forbidden in packages/engine.' },
            { name: 'node:dgram', message: 'node:dgram is forbidden in packages/engine.' },
            { name: 'dns', message: 'dns is forbidden in packages/engine.' },
            { name: 'node:dns', message: 'node:dns is forbidden in packages/engine.' },
            { name: 'tls', message: 'tls is forbidden in packages/engine.' },
            { name: 'node:tls', message: 'node:tls is forbidden in packages/engine.' },
            { name: 'process', message: 'process is forbidden in packages/engine.' },
            { name: 'node:process', message: 'node:process is forbidden in packages/engine.' },
            { name: 'axios', message: 'axios is forbidden in packages/engine.' },
            { name: 'openai', message: 'Model imports are forbidden in packages/engine.' },
            { name: '@google/genai', message: 'Model imports are forbidden in packages/engine.' },
            {
              name: '@anthropic-ai/sdk',
              message: 'Model imports are forbidden in packages/engine.',
            },
          ],
          patterns: [
            {
              group: ['*model*', '**/model/**'],
              message: 'Model packages and adapters are forbidden in packages/engine.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message:
            'Math.random is forbidden in packages/engine. The deterministic engine must have no randomness.',
        },
        {
          selector: "MemberExpression[object.name='Date'][property.name='now']",
          message:
            'Date.now() is forbidden in packages/engine. The deterministic engine must not access the clock.',
        },
        {
          selector: "NewExpression[callee.name='Date']",
          message:
            'new Date() is forbidden in packages/engine. The deterministic engine must not access the clock.',
        },
      ],
    },
  },
);
