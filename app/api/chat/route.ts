import {
  convertToModelMessages,
  createIdGenerator,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  validateUIMessages,
  type UIMessage,
} from 'ai';
import {ollama} from 'ollama-ai-provider-v2';
import {loadChat, saveChat} from '@/lib/chat-store';
import {CHAT_MODEL_ID, CHAT_SYSTEM_PROMPT, GUARD_MODEL_ID} from '@/lib/config';
import {runGuardrails, type GuardrailBlock} from '@/lib/guardrails';
import {logger} from '@/lib/logger';
import {tools} from '@/lib/tools';

// Client sends only the new turn. History comes from the server store.
type ChatBody = {
  id: string;
  message: UIMessage;
};

const generateMessageId = createIdGenerator({prefix: 'msg', size: 16});

const REFUSAL_WORD_MS = 18;

function clientIdOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'local';
}

// Only the latest user turn is client supplied. Keep text parts so a forged
// tool result cannot ride in on this message either.
function toUserMessage(message: UIMessage): UIMessage {
  return {
    id: message.id,
    role: 'user',
    parts: message.parts.filter((part) => part.type === 'text'),
  };
}

// A blocked message is answered, not errored. Storing the turn is what lets a
// later one see the block already happened.
function refusalResponse({
  chatId,
  messages,
  blocked,
}: {
  chatId: string;
  messages: UIMessage[];
  blocked: GuardrailBlock;
}) {
  const id = generateMessageId();
  // degraded marks an outage, so a dead guard cannot pass for a real block.
  const refusal: UIMessage = {
    id,
    role: 'assistant',
    metadata: {guardrail: blocked.guardrail, degraded: blocked.degraded},
    parts: [{type: 'text', text: blocked.reason}],
  };

  saveChat({chatId, messages: [...messages, refusal]});

  const stream = createUIMessageStream<UIMessage>({
    // Word by word, or it reads as a different kind of message to the one
    // streaming next to it.
    execute: async ({writer}) => {
      writer.write({type: 'text-start', id});

      for (const [index, word] of blocked.reason.split(' ').entries()) {
        writer.write({
          type: 'text-delta',
          id,
          delta: index ? ` ${word}` : word,
        });
        await new Promise((resolve) => setTimeout(resolve, REFUSAL_WORD_MS));
      }

      writer.write({type: 'text-end', id});
    },
  });

  return createUIMessageStreamResponse({stream});
}

export async function POST(request: Request) {
  let body: ChatBody | undefined;

  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({error: 'invalid JSON body'}, {status: 400});
  }

  const {id, message} = body ?? {};

  if (typeof id !== 'string' || !message || typeof message !== 'object') {
    return Response.json({error: 'id and message are required'}, {status: 400});
  }

  if (message.role !== 'user') {
    return Response.json(
      {error: 'message must be a user message'},
      {status: 400},
    );
  }

  if (!id.trim()) {
    return Response.json({error: 'invalid chat id'}, {status: 400});
  }

  const userMessage = toUserMessage(message);

  if (!userMessage.parts.length) {
    return Response.json({error: 'message must contain text'}, {status: 400});
  }

  const messages = [...loadChat(id), userMessage];

  let validatedMessages: UIMessage[];
  try {
    // Tool input generics are narrower than validateUIMessages expects.
    validatedMessages = await validateUIMessages({
      messages,
      tools: tools as Parameters<typeof validateUIMessages>[0]['tools'],
    });
  } catch (error) {
    logger.warn({error}, 'chat messages failed validation');
    return Response.json({error: 'invalid messages'}, {status: 400});
  }

  const blocked = await runGuardrails({
    clientId: clientIdOf(request),
    messages: validatedMessages,
  });

  if (blocked) {
    logger.warn(blocked, 'guardrail blocked message');

    // The topic guard being down is an outage, worth its own line.
    if (blocked.degraded) {
      logger.warn(
        {guardModel: GUARD_MODEL_ID},
        'topic guardrail did not answer',
      );
    }

    // Rate limiting is the one block that errors, so the one never stored.
    return blocked.guardrail === 'rate'
      ? Response.json({error: blocked.reason}, {status: 429})
      : refusalResponse({chatId: id, messages: validatedMessages, blocked});
  }

  // streamText handles the Ollama call, chunk parsing, and tool loop.
  const result = streamText({
    model: ollama(CHAT_MODEL_ID),
    system: CHAT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(validatedMessages),
    tools,
    providerOptions: {ollama: {options: {seed: 1, temperature: 0}}},
    stopWhen: isStepCount(5),
    onFinish: ({finishReason, usage, steps}) => {
      const toolCalls = steps.flatMap((step) =>
        step.toolCalls.map((call) => call.toolName),
      );

      logger.info(
        {model: CHAT_MODEL_ID, finishReason, usage, toolCalls},
        'model call finished',
      );
    },
    onError: ({error}) => {
      logger.error({model: CHAT_MODEL_ID, error}, 'model call failed');
    },
  });

  result.consumeStream();

  // Model stream to UI chunks for useChat, plus SSE headers.
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: validatedMessages,
      generateMessageId,
      onEnd: ({messages: nextMessages}) => {
        saveChat({chatId: id, messages: nextMessages});
      },
    }),
  });
}
