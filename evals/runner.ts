// Posts each case turn to the real chat route.
import {randomUUID} from 'node:crypto';
import type {UIMessage} from 'ai';
import {POST} from '@/app/api/chat/route';
import {loadChat} from '@/lib/chat-store';
import type {EvalCase, ToolCall, TurnResult} from '@/evals/types';

function postTurn(chatId: string, clientId: string, text: string) {
  return POST(
    new Request('http://localhost/api/chat', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': clientId,
      },
      body: JSON.stringify({
        id: chatId,
        message: {
          id: randomUUID(),
          role: 'user',
          parts: [{type: 'text', text}],
        },
      }),
    }),
  );
}

// Drain the SSE body before loadChat so onEnd can saveChat.
async function readStreamText(response: Response): Promise<string> {
  const body = await response.text();

  return body
    .split('\n')
    .filter((line) => line.startsWith('data: '))
    .map((line) => line.slice(6))
    .filter((payload) => payload !== '[DONE]')
    .map((payload) => JSON.parse(payload) as {type: string; delta?: string})
    .filter((chunk) => chunk.type === 'text-delta')
    .map((chunk) => chunk.delta ?? '')
    .join('');
}

function toolCallsFrom(messages: UIMessage[]): ToolCall[] {
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

async function readTurn(
  response: Response,
  chatId: string,
  savedBefore: number,
): Promise<Omit<TurnResult, 'user'>> {
  const streamed =
    response.headers.get('content-type')?.includes('text/event-stream') ??
    false;

  const text = streamed
    ? await readStreamText(response)
    : await response.text();
  const after = loadChat(chatId);

  return {
    status: response.status,
    text,
    toolCalls: toolCallsFrom(after.slice(savedBefore)),
    saved: after.length - savedBefore,
  };
}

export async function runCase(evalCase: EvalCase): Promise<TurnResult[]> {
  const chatId = `eval-${randomUUID()}`;
  const clientId = `eval-${randomUUID()}`;
  const results: TurnResult[] = [];

  for (const turn of evalCase.turns) {
    const savedBefore = loadChat(chatId).length;
    const response = await postTurn(chatId, clientId, turn.user);

    results.push({
      user: turn.user,
      ...(await readTurn(response, chatId, savedBefore)),
    });
  }

  return results;
}
