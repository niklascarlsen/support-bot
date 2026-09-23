// Compares a turn result to what the case expected.
import {REFUSAL_MESSAGE} from '@/lib/config';
import {judgeGrounding} from '@/evals/judge';
import type {
  Expectation,
  ReplyExpectation,
  ToolCall,
  ToolExpectation,
  TurnResult,
} from '@/evals/types';

const MARKDOWN_PATTERNS = [
  {name: 'bold', pattern: /\*\*/},
  {name: 'heading', pattern: /^#{1,6}\s/m},
  {name: 'bullet list', pattern: /^\s*[-*]\s/m},
  {name: 'numbered list', pattern: /^\s*\d+\.\s/m},
];

const EMOJI = /\p{Emoji_Presentation}|\uFE0F/u;

function checkPlainText(text: string): string[] {
  const found = MARKDOWN_PATTERNS.filter((entry) =>
    entry.pattern.test(text),
  ).map((entry) => `reply used ${entry.name}`);

  return EMOJI.test(text) ? [...found, 'reply used an emoji'] : found;
}

function checkToolInput(
  call: ToolCall,
  expected: Record<string, unknown>,
): string[] {
  const actual = (call.input ?? {}) as Record<string, unknown>;

  return Object.entries(expected)
    .filter(([key, value]) => actual[key] !== value)
    .map(
      ([key, value]) =>
        `${call.name}.${key} was ${JSON.stringify(actual[key])}, expected ${JSON.stringify(value)}`,
    );
}

function checkTools(
  expect: ToolExpectation | 'none' | undefined,
  calls: ToolCall[],
): string[] {
  if (expect === undefined) return [];

  if (expect === 'none') {
    return calls.length
      ? [`expected no tool call, got ${calls.map((c) => c.name).join(', ')}`]
      : [];
  }

  // Last call wins. A turn can miss once and correct itself.
  const call = calls.findLast((entry) => entry.name === expect.name);

  if (!call) {
    const got = calls.length ? calls.map((c) => c.name).join(', ') : 'none';
    return [`expected a ${expect.name} call, got ${got}`];
  }

  const failures = expect.input ? checkToolInput(call, expect.input) : [];

  if (expect.found === undefined) return failures;

  const output = (call.output ?? {}) as {found?: boolean};

  return output.found === expect.found
    ? failures
    : [...failures, `${call.name} found was ${output.found}`];
}

function checkReply(
  expect: ReplyExpectation | undefined,
  text: string,
): string[] {
  if (!expect) return [];

  const failures: string[] = [];
  const haystack = text.toLowerCase();

  if (expect.refusal && text.trim() !== REFUSAL_MESSAGE) {
    failures.push(`reply was not the refusal wording, got ${text.trim()}`);
  }

  for (const needle of expect.includes ?? []) {
    if (!haystack.includes(needle.toLowerCase())) {
      failures.push(`reply is missing ${JSON.stringify(needle)}`);
    }
  }

  for (const needle of expect.excludes ?? []) {
    if (haystack.includes(needle.toLowerCase())) {
      failures.push(`reply leaked ${JSON.stringify(needle)}`);
    }
  }

  return expect.plainText ? [...failures, ...checkPlainText(text)] : failures;
}

export type TurnCheck = {
  failures: string[];
  judge: 'PASS' | 'FAIL' | 'error' | null;
};

// Structural checks first. Judge only when grounded is set.
export async function checkTurn(
  expect: Expectation,
  result: TurnResult,
): Promise<TurnCheck> {
  const failures: string[] = [];
  const expectedStatus = expect.status ?? 200;

  if (result.status !== expectedStatus) {
    failures.push(`status was ${result.status}, expected ${expectedStatus}`);
  }

  // An outage blocks every message, so a green run would mean nothing.
  if (result.degraded) {
    failures.push('the topic guard errored instead of deciding');
  }

  const answeredBy = expect.answeredBy ?? 'model';
  const actual = result.guardrail ? 'guard' : 'model';

  if (actual !== answeredBy) {
    failures.push(
      `expected ${answeredBy} to answer, ${result.guardrail ?? 'the model'} did`,
    );
  }

  const checked = [
    ...failures,
    ...checkTools(expect.tool, result.toolCalls),
    ...checkReply(expect.reply, result.text),
  ];

  if (!expect.reply?.grounded) return {failures: checked, judge: null};

  const judged = await judgeGrounding({
    question: result.user,
    reply: result.text,
    toolCalls: result.toolCalls,
  });

  return {
    failures: [...checked, ...judged.failures],
    judge: judged.verdict,
  };
}
