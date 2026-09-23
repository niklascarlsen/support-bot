import 'server-only';
import {noul, TypeSafeClient} from '@typesafe-ai/sdk';
import {GREETING_MESSAGE, GUARD_MODEL_ID, REFUSAL_MESSAGE} from '@/lib/config';
import {logger} from '@/lib/logger';

type GuardrailResult =
  | {ok: true; degraded?: boolean}
  | {ok: false; reason: string; degraded?: boolean};

export type GuardrailBlock = {
  guardrail: 'rate' | 'input' | 'topic';
  reason: string;
  // Topic guard timed out or errored, not an off topic block.
  degraded?: boolean;
};

type ChatMessage = {
  role: string;
  parts?: Array<{type: string; text?: string}>;
};

type Turn = {role: string; text: string};

function partsToText(message: ChatMessage): string {
  if (!Array.isArray(message.parts)) return '';

  return message.parts
    .filter((p) => p.type === 'text' && typeof p.text === 'string')
    .map((p) => p.text!)
    .join('\n');
}

function extractLatestUserText(messages: ChatMessage[]): string {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  return lastUser ? partsToText(lastUser) : '';
}

const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/g;
// Six letters or digits with at least one digit. Plain words never match, so
// "returns" and "policy" survive while an order id does not.
const ORDER_ID = /\b(?=[a-z0-9]{6}\b)[a-z]*\d[a-z0-9]*\b/gi;

// The guard needs to know a value was given, never which one.
function redact(text: string): string {
  return text.replace(EMAIL, '<email>').replace(ORDER_ID, '<order-id>');
}

function extractRecentTranscript(messages: ChatMessage[], turns = 4): Turn[] {
  return messages
    .slice(-turns - 1, -1)
    .map((m) => ({role: m.role, text: redact(partsToText(m))}))
    .filter((m) => m.text);
}

const MAX_INPUT_LENGTH = 4000;

function checkUserInput(text: string): GuardrailResult {
  const trimmed = text.trim();

  if (!trimmed) {
    return {ok: false, reason: 'Empty message'};
  }

  if (trimmed.length > MAX_INPUT_LENGTH) {
    return {ok: false, reason: 'That message is too long.'};
  }

  return {ok: true};
}

const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map<string, number[]>();

function checkRate(clientId: string): GuardrailResult {
  const now = Date.now();
  const recent = (requestLog.get(clientId) ?? []).filter(
    (at) => now - at < RATE_LIMIT_WINDOW_MS,
  );

  recent.push(now);
  requestLog.set(clientId, recent);

  if (recent.length > RATE_LIMIT_MAX_REQUESTS) {
    return {ok: false, reason: 'Too many messages. Wait a minute and retry.'};
  }

  return {ok: true};
}

// Narrow on purpose. Tools decide what can be answered, not these questions.
// The message rides in state as data, so there is no prompt to escape.
const QUESTIONS = {
  offTopic: noul(
    'Is the person writing `message` using the support chat of the Prestige Worldwide shop for something other than being a customer of that shop?',
    {
      true: 'The message wants something the shop has nothing to do with, such as weather, general knowledge, coding, recipes, advice or roleplay. This is someone using the assistant as a general purpose model.',
      false:
        'The message is anything a customer of this shop could plausibly send, including a question the assistant may turn out to have no answer for, a short reply, an unclear reply, or a complaint.',
    },
  ),
  // Only the shape of the answer. getShopInfo covers what the bot can do.
  wantsDifferentFormat: noul(
    'Is `message` asking the assistant to change the shape or style of its answers rather than asking anything about the shop?',
    {
      true: 'It asks for markdown, headings, bullet lists, emoji, a different tone, or otherwise tells the assistant how to write.',
      false:
        'It asks about the shop, a product, an order or a policy, or it asks what this support chat covers. A shop question that also makes a demand about wording belongs here too, the question is what matters.',
    },
  ),
  // Greetings, noise and abuse are neither of the above, they are nothing at
  // all. Reads the conversation, so a bare order id mid thread still counts.
  nothingToActOn: noul(
    'Taking `conversation` into account, is there nothing in `message` that a shop support assistant could act on?',
    {
      true: 'It is a greeting, small talk, typed noise, or abuse, and it asks for nothing and answers nothing. Nobody is waiting for a shop answer.',
      false:
        'It asks for something, reports a problem, or carries on the conversation above it. A bare order id, an email address, a yes, a no, an ok, or an unsure reply all carry the thread forward and count as something to act on.',
    },
  ),
};

// Measured over the eval cases and the dev traces. A message to turn down
// lands at 0.88 and up, one the model should answer at 0.57 and down.
const BLOCK_ABOVE = 0.8;

const GUARD_TIMEOUT_MS = 10_000;

let client: TypeSafeClient | undefined;

// Built on first use. The constructor throws without an api key.
function guardClient(): TypeSafeClient {
  return (client ??= new TypeSafeClient());
}

async function checkTopic(
  text: string,
  transcript: Turn[],
): Promise<GuardrailResult> {
  try {
    const {answers} = await guardClient().systemOne(
      {
        model: GUARD_MODEL_ID,
        state: {conversation: transcript, message: redact(text)},
        questions: QUESTIONS,
      },
      // The sdk deadline is per attempt, so one signal covers the retries too.
      {signal: AbortSignal.timeout(GUARD_TIMEOUT_MS)},
    );

    const names = Object.keys(QUESTIONS) as Array<keyof typeof QUESTIONS>;
    const fired = names.find((name) => answers[name].noul > BLOCK_ABOVE);

    // Mid thread a greeting reads as the bot forgetting where it was.
    if (fired) {
      const opensTheChat =
        fired === 'nothingToActOn' && transcript.length === 0;

      return {
        ok: false,
        reason: opensTheChat ? GREETING_MESSAGE : REFUSAL_MESSAGE,
      };
    }

    return {ok: true};
  } catch (error) {
    // Fail closed. degraded marks an outage, not an off topic hit.
    logger.warn({error}, 'topic guard call failed');

    return {
      ok: false,
      reason: 'I cannot check that right now. Please try again in a moment.',
      degraded: true,
    };
  }
}

// Cheapest first. Returns the first block, or null when allowed.
export async function runGuardrails({
  clientId,
  messages,
}: {
  clientId: string;
  messages: ChatMessage[];
}): Promise<GuardrailBlock | null> {
  const rate = checkRate(clientId);
  if (!rate.ok) return {guardrail: 'rate', reason: rate.reason};

  const text = extractLatestUserText(messages);

  const input = checkUserInput(text);
  if (!input.ok) return {guardrail: 'input', reason: input.reason};

  const topic = await checkTopic(text, extractRecentTranscript(messages));
  if (!topic.ok) {
    return {guardrail: 'topic', reason: topic.reason, degraded: topic.degraded};
  }

  return null;
}
