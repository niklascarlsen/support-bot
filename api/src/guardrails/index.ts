const BLOCKED_PATTERNS = [
  /\bignore\s+(all\s+)?(previous|prior)\s+instructions\b/i,
  /\bsystem\s+prompt\b/i,
];

// Lightweight input checks before calling the model. Expand later.
export type GuardrailResult = {ok: true} | {ok: false; reason: string};

export function checkUserInput(text: string): GuardrailResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {ok: false, reason: 'Empty message'};
  }

  if (trimmed.length > 4000) {
    return {ok: false, reason: 'Message too long'};
  }

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {ok: false, reason: 'Message blocked by input guardrail'};
    }
  }

  return {ok: true};
}

export function extractLatestUserText(
  messages: Array<{
    role: string;
    parts?: Array<{type: string; text?: string}>;
  }>,
): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) return '';

  if (Array.isArray(lastUser.parts)) {
    return lastUser.parts
      .filter((p) => p.type === 'text' && typeof p.text === 'string')
      .map((p) => p.text!)
      .join('\n');
  }

  return '';
}
