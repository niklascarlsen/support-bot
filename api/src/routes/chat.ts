import type {FastifyPluginAsync} from 'fastify';
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
import {CHAT_MODEL_ID, CHAT_SYSTEM_PROMPT, GUARD_MODEL_ID} from '../config.ts';
import {runGuardrails} from '../guardrails/index.ts';
import {tools} from '../tools/index.ts';

// UIMessage is the useChat format (id, role, parts), not the model format.
type ChatBody = {
  messages: UIMessage[];
};

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

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{Body: ChatBody}>('/chat', async (request, reply) => {
    const {messages} = request.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({error: 'messages array is required'});
    }

    const blocked = await runGuardrails({clientId: request.ip, messages});

    if (blocked) {
      request.log.warn(blocked, 'guardrail blocked message');

      // The topic guard being down is an outage, worth its own line.
      if (blocked.degraded) {
        request.log.warn(
          {guardModel: GUARD_MODEL_ID},
          'topic guardrail did not answer',
        );
      }

      // Rate limiting is the one block that is an error, not an answer.
      return blocked.guardrail === 'rate'
        ? reply.status(429).send({error: blocked.reason})
        : refusalResponse(blocked.reason);
    }

    // streamText handles the Ollama call, chunk parsing, and tool loop.
    const result = streamText({
      model: ollama(CHAT_MODEL_ID),
      system: CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: isStepCount(5),
      onFinish: ({finishReason, usage, steps}) => {
        const toolCalls = steps.flatMap((step) =>
          step.toolCalls.map((call) => call.toolName),
        );

        request.log.info(
          {model: CHAT_MODEL_ID, finishReason, usage, toolCalls},
          'model call finished',
        );
      },
      onError: ({error}) => {
        request.log.error({model: CHAT_MODEL_ID, error}, 'model call failed');
      },
    });

    // Model stream to UI chunks for useChat, plus SSE headers.
    // Fastify unwraps the Web Response status, headers, and body itself.
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({stream: result.stream}),
    });
  });
};
