import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const engineDir = path.resolve(rootDir, 'packages', 'engine');
const engineSrc = path.resolve(engineDir, 'src');

const BANNED_IMPORTS = new Set([
  'fs',
  'node:fs',
  'node:fs/promises',
  'fs/promises',
  'http',
  'node:http',
  'https',
  'node:https',
  'http2',
  'node:http2',
  'net',
  'node:net',
  'tls',
  'node:tls',
  'dgram',
  'node:dgram',
  'dns',
  'node:dns',
  'child_process',
  'node:child_process',
  'cluster',
  'node:cluster',
  'os',
  'node:os',
  'process',
  'node:process',
  'axios',
  'node-fetch',
  'undici',
  'pg',
  'pg-pool',
  'openai',
  '@google/genai',
  '@anthropic-ai/sdk',
]);

interface BoundaryViolation {
  file: string;
  line: number;
  column: number;
  message: string;
}

const violations: BoundaryViolation[] = [];

// 1. Verify packages/engine/package.json dependencies
const enginePkgPath = path.join(engineDir, 'package.json');
if (fs.existsSync(enginePkgPath)) {
  const pkg = JSON.parse(fs.readFileSync(enginePkgPath, 'utf8'));
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.peerDependencies,
  };

  for (const dep of Object.keys(allDeps)) {
    if (BANNED_IMPORTS.has(dep) || dep.includes('model')) {
      violations.push({
        file: enginePkgPath,
        line: 1,
        column: 1,
        message: `Forbidden dependency in engine package.json: "${dep}". Engine must not have I/O, network, or model dependencies.`,
      });
    }
  }
}

// 2. Scan AST of all source files in packages/engine/src
function scanSourceFile(filePath: string) {
  const content = fs.readFileSync(filePath, 'utf8');
  const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);

  function getLineAndCol(node: ts.Node) {
    const { line, character } = sourceFile.getLineAndCharacterOfPosition(node.getStart());
    return { line: line + 1, column: character + 1 };
  }

  function visit(node: ts.Node) {
    // Check import declarations
    if (ts.isImportDeclaration(node)) {
      const moduleSpecifier = node.moduleSpecifier;
      if (ts.isStringLiteral(moduleSpecifier)) {
        const importPath = moduleSpecifier.text;
        if (
          BANNED_IMPORTS.has(importPath) ||
          importPath.includes('/model') ||
          importPath.includes('@stratiq/model')
        ) {
          const { line, column } = getLineAndCol(node);
          violations.push({
            file: filePath,
            line,
            column,
            message: `Forbidden import "${importPath}". packages/engine must have no I/O, network, or model imports.`,
          });
        }
      }
    }

    // Check export ... from declarations
    if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
      if (ts.isStringLiteral(node.moduleSpecifier)) {
        const importPath = node.moduleSpecifier.text;
        if (
          BANNED_IMPORTS.has(importPath) ||
          importPath.includes('/model') ||
          importPath.includes('@stratiq/model')
        ) {
          const { line, column } = getLineAndCol(node);
          violations.push({
            file: filePath,
            line,
            column,
            message: `Forbidden export from "${importPath}". packages/engine must have no I/O, network, or model imports.`,
          });
        }
      }
    }

    // Check dynamic imports
    if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword) {
      const arg = node.arguments[0];
      if (arg && ts.isStringLiteral(arg)) {
        if (BANNED_IMPORTS.has(arg.text) || arg.text.includes('model')) {
          const { line, column } = getLineAndCol(node);
          violations.push({
            file: filePath,
            line,
            column,
            message: `Forbidden dynamic import "${arg.text}".`,
          });
        }
      }
    }

    // Check banned identifiers and globals
    if (ts.isIdentifier(node)) {
      if (node.text === 'Date') {
        const { line, column } = getLineAndCol(node);
        violations.push({
          file: filePath,
          line,
          column,
          message:
            'Forbidden use of Date. Clock access is banned in packages/engine. Explicit asOfDate must be provided as an input.',
        });
      }
      if (node.text === 'fetch') {
        const { line, column } = getLineAndCol(node);
        violations.push({
          file: filePath,
          line,
          column,
          message: 'Forbidden use of fetch. Network access is banned in packages/engine.',
        });
      }
      if (
        node.text === 'setTimeout' ||
        node.text === 'setInterval' ||
        node.text === 'setImmediate'
      ) {
        const { line, column } = getLineAndCol(node);
        violations.push({
          file: filePath,
          line,
          column,
          message: `Forbidden timer function "${node.text}". Engine must be pure computation.`,
        });
      }
    }

    // Check Math.random
    if (ts.isPropertyAccessExpression(node)) {
      if (
        ts.isIdentifier(node.expression) &&
        node.expression.text === 'Math' &&
        node.name.text === 'random'
      ) {
        const { line, column } = getLineAndCol(node);
        violations.push({
          file: filePath,
          line,
          column,
          message:
            'Forbidden Math.random(). Randomness is banned in packages/engine. All computations must be deterministic.',
        });
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
}

function walkDir(dir: string) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkDir(fullPath);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Don't test the test files for test mock purposes unless specified, but engine tests should also not have model imports
      scanSourceFile(fullPath);
    }
  }
}

walkDir(engineSrc);

if (violations.length > 0) {
  console.error('\n❌ Architectural boundary violations detected in packages/engine:\n');
  for (const v of violations) {
    const relFile = path.relative(rootDir, v.file);
    console.error(`  ${relFile}:${v.line}:${v.column} - ${v.message}`);
  }
  console.error(
    '\nEnforcement Rule (AGENTS.md §5.1): packages/engine must be a pure library with zero I/O, zero network, zero clock, zero randomness, and zero model dependencies.\n',
  );
  process.exit(1);
} else {
  console.log(
    '✓ Engine boundary check passed: packages/engine is strictly pure (0 I/O, 0 network, 0 clock, 0 randomness, 0 model dependencies).',
  );
}
