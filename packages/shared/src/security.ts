/**
 * Inbound credential and secret scanner.
 * Per docs/03_ARCHITECTURE.md §10 and AGENTS.md §5.6:
 * Scans inbound text before persistence and model calls.
 * Never stores passwords, tokens, API keys, or Meta access tokens.
 */

export interface CredentialScanResult {
  hasCredentials: boolean;
  redacted: string;
  matches: string[];
}

const CREDENTIAL_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  {
    name: 'meta_access_token',
    regex: /\bEAA[a-zA-Z0-9]{20,}\b/g,
  },
  {
    name: 'bearer_token',
    regex: /Bearer\s+[a-zA-Z0-9_.-]{16,}/gi,
  },
  {
    name: 'api_key_assignment',
    regex:
      /\b(api[_-]?key|client[_-]?secret|auth[_-]?token|access[_-]?token)\s*[:=]\s*['"]?[a-zA-Z0-9_-]{16,}['"]?/gi,
  },
  {
    name: 'password_assignment',
    regex: /\b(password|passwd|passcode|secret_key|private_key)\s*[:=]\s*['"]?[^\s'"]{4,}['"]?/gi,
  },
  {
    name: 'generic_api_key',
    regex: /\b(sk-[a-zA-Z0-9]{20,}|ghp_[a-zA-Z0-9]{30,}|AIzaSy[a-zA-Z0-9_-]{33})\b/g,
  },
  {
    name: 'credit_card',
    regex:
      /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12})\b/g,
  },
  {
    name: 'private_key_header',
    regex: /-----BEGIN [A-Z ]+PRIVATE KEY-----[\s\S]*?-----END [A-Z ]+PRIVATE KEY-----/g,
  },
];

export function scanAndRedactCredentials(text: string): CredentialScanResult {
  if (!text || typeof text !== 'string') {
    return { hasCredentials: false, redacted: text ?? '', matches: [] };
  }

  let redacted = text;
  const matches: string[] = [];

  for (const { name, regex } of CREDENTIAL_PATTERNS) {
    regex.lastIndex = 0;
    const found = text.match(regex);
    if (found) {
      for (const m of found) {
        matches.push(`${name}:${m.slice(0, 4)}...`);
      }
      redacted = redacted.replace(regex, '[REDACTED_CREDENTIAL]');
    }
  }

  return {
    hasCredentials: matches.length > 0,
    redacted,
    matches,
  };
}
