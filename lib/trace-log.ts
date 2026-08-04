import 'server-only';
import {appendFileSync, mkdirSync} from 'node:fs';
import {join} from 'node:path';
import type {UIMessage} from 'ai';
import {logger} from '@/lib/logger';

const isDev = process.env.NODE_ENV === 'development';

// cwd, not import.meta.url. The route bundle would resolve inside .next.
const TRACE_DIR = join(process.cwd(), 'traces');
const TRACE_FILE = join(TRACE_DIR, 'dev.jsonl');

function textOf(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => (part as {text: string}).text)
    .join('');
}

function toolCallsOf(messages: UIMessage[]) {
  return messages.flatMap((message) =>
    message.parts
      .filter((part) => part.type.startsWith('tool-'))
      .map((part) => {
        const call = part as {type: string; input?: unknown; output?: unknown};

        return {
          name: call.type.slice('tool-'.length),
          input: call.input,
          output: call.output,
        };
      }),
  );
}

// One line per finished turn, same shape as the eval runner.
export function appendTrace(chatId: string, added: UIMessage[]): void {
  if (!isDev || !added.length) return;

  const user = added.find((message) => message.role === 'user');
  const assistant = added.findLast((message) => message.role === 'assistant');

  const line = {
    at: new Date().toISOString(),
    chatId,
    user: user ? textOf(user) : '',
    reply: assistant ? textOf(assistant) : '',
    toolCalls: toolCallsOf(added),
  };

  try {
    mkdirSync(TRACE_DIR, {recursive: true});
    appendFileSync(TRACE_FILE, `${JSON.stringify(line)}\n`);
  } catch (error) {
    logger.warn({error}, 'could not append trace');
  }
}
