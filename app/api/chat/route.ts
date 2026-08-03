import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import {ollama} from 'ollama-ai-provider-v2';
import {CHAT_MODEL_ID, CHAT_SYSTEM_PROMPT, GUARD_MODEL_ID} from '@/lib/config';
import {runGuardrails} from '@/lib/guardrails';
import {logger} from '@/lib/logger';
import {tools} from '@/lib/tools';

// UIMessage is the useChat format (id, role, parts), not the model format.
type ChatBody = {
  messages: UIMessage[];
};

// A route handler has no socket address, only headers. Without a proxy the
// header is missing and everyone shares one bucket, same as today on ::1.
function clientIdOf(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  return forwarded?.split(',')[0].trim() || 'local';
}

// A blocked message is answered, not errored. The refusal is streamed as a
// normal assistant turn so it stays in the transcript like any other reply.
function refusalResponse(reason: string) {
  const stream = createUIMessageStream<UIMessage>({
    execute: ({writer}) => {
      const id = 'guardrail-refusal';
      writer.write({type: 'text-start', id});
      writer.write({type: 'text-delta', id, delta: reason});
      writer.write({type: 'text-end', id});
    },
  });

  return createUIMessageStreamResponse({stream});
}

export async function POST(request: Request) {
  let body: ChatBody | undefined;

  // Fastify parsed the body and answered 400 on broken JSON. Next does not.
  try {
    body = (await request.json()) as ChatBody;
  } catch {
    return Response.json({error: 'invalid JSON body'}, {status: 400});
  }

  const {messages} = body ?? {};

  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json({error: 'messages array is required'}, {status: 400});
  }

  const blocked = await runGuardrails({
    clientId: clientIdOf(request),
    messages,
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

    // Rate limiting is the one block that is an error, not an answer.
    return blocked.guardrail === 'rate'
      ? Response.json({error: blocked.reason}, {status: 429})
      : refusalResponse(blocked.reason);
  }

  // streamText handles the Ollama call, chunk parsing, and tool loop.
  const result = streamText({
    model: ollama(CHAT_MODEL_ID),
    system: CHAT_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
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

  // Model stream to UI chunks for useChat, plus SSE headers.
  return createUIMessageStreamResponse({
    stream: toUIMessageStream({stream: result.stream}),
  });
}
