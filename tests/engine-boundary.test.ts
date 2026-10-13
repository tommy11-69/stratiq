import { execSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

describe('Engine Import & Purity Boundary Verification', () => {
  it('passes boundary check on the current engine codebase', () => {
    const scriptPath = path.resolve(rootDir, 'scripts', 'check-engine-boundary.ts');
    const result = execSync(`npx tsx "${scriptPath}"`, {
      cwd: rootDir,
      encoding: 'utf8',
    });
    expect(result).toContain('Engine boundary check passed');
  });

  it('detects violations if a file contains banned globals or imports', async () => {
    // Dynamically test the checker logic against simulated violation code snippets
    const ts = await import('typescript');
    const BANNED_IMPORTS = new Set(['fs', 'http', 'openai', '@google/genai']);

    function checkForViolations(sourceCode: string) {
      const sourceFile = ts.createSourceFile('test.ts', sourceCode, ts.ScriptTarget.Latest, true);
      const violations: string[] = [];

      function visit(node: ts.Node) {
        if (ts.isImportDeclaration(node)) {
          const spec = node.moduleSpecifier;
          if (
            ts.isStringLiteral(spec) &&
            (BANNED_IMPORTS.has(spec.text) || spec.text.includes('model'))
          ) {
            violations.push(`banned_import:${spec.text}`);
          }
        }
        if (ts.isIdentifier(node)) {
          if (node.text === 'Date') violations.push('banned_global:Date');
          if (node.text === 'fetch') violations.push('banned_global:fetch');
        }
        if (ts.isPropertyAccessExpression(node)) {
          if (
            ts.isIdentifier(node.expression) &&
            node.expression.text === 'Math' &&
            node.name.text === 'random'
          ) {
            violations.push('banned_call:Math.random');
          }
        }
        ts.forEachChild(node, visit);
      }

      visit(sourceFile);
      return violations;
    }

    expect(checkForViolations('const d = new Date();')).toContain('banned_global:Date');
    expect(checkForViolations('const r = Math.random();')).toContain('banned_call:Math.random');
    expect(checkForViolations("import fs from 'fs';")).toContain('banned_import:fs');
    expect(checkForViolations("import { x } from '@stratiq/model';")).toContain(
      'banned_import:@stratiq/model',
    );
    expect(checkForViolations('await fetch("https://example.com");')).toContain(
      'banned_global:fetch',
    );
  });
});
