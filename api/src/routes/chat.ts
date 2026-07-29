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
import {
  checkRate,
  checkTopic,
  checkUserInput,
  extractLatestUserText,
  extractRecentTranscript,
} from '../guardrails/index.ts';
import {tools} from '../tools/index.ts';

// UIMessage is the useChat format (id, role, parts), not the model format.
type ChatBody = {
  messages: UIMessage[];
};

export const chatRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post<{Body: ChatBody}>('/chat', async (request, reply) => {
  const {messages} = request.body ?? {};

    if (!Array.isArray(messages) || messages.length === 0) {
      return reply.status(400).send({error: 'messages array is required'});
    }

    // Custom guardrails before the model call. Not part of the SDK.
    // Cheapest checks first, the extra model call last.
    const latestUserText = extractLatestUserText(messages);

    const logBlock = (name: string, reason: string) => {
      request.log.warn(
        {guardrail: name, reason, text: latestUserText.slice(0, 200)},
        'guardrail blocked message',
      );
    };

    // A blocked message is answered, not errored. The refusal is streamed as a
    // normal assistant turn so it stays in the transcript like any other reply.
    const refuse = (name: string, reason: string) => {
      logBlock(name, reason);

      const stream = createUIMessageStream<UIMessage>({
        execute: ({writer}) => {
          const id = 'guardrail-refusal';
          writer.write({type: 'text-start', id});
          writer.write({type: 'text-delta', id, delta: reason});
          writer.write({type: 'text-end', id});
        },
      });

      return createUIMessageStreamResponse({stream});
    };

    const rate = checkRate(request.ip);
    if (!rate.ok) {
      logBlock('rate', rate.reason);
      return reply.status(429).send({error: rate.reason});
    }

    const input = checkUserInput(latestUserText);
    if (!input.ok) return refuse('input', input.reason);

    const topic = await checkTopic(
      latestUserText,
      extractRecentTranscript(messages),
    );
    if (!topic.ok) return refuse('topic', topic.reason);

    if (topic.degraded) {
      request.log.warn(
        {guardModel: GUARD_MODEL_ID},
        'topic guardrail failed, message allowed through',
      );
    }

    request.log.info(
      {model: CHAT_MODEL_ID, guardModel: GUARD_MODEL_ID},
      'guardrails passed, calling model',
    );

    // streamText handles the Ollama call, chunk parsing, and tool loop.
    const result = streamText({
      model: ollama(CHAT_MODEL_ID),
      system: CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: isStepCount(5),
      onFinish: ({finishReason, usage, steps}) => {
        request.log.info(
          {
            model: CHAT_MODEL_ID,
            finishReason,
            usage,
            toolCalls: steps.flatMap((step) =>
              step.toolCalls.map((call) => call.toolName),
            ),
          },
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
