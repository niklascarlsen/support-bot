import type {FastifyPluginAsync} from 'fastify';
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
  type UIMessage,
} from 'ai';
import {ollama} from 'ollama-ai-provider-v2';
import {CHAT_MODEL_ID, CHAT_SYSTEM_PROMPT} from '../config.ts';
import {checkUserInput, extractLatestUserText} from '../guardrails/index.ts';
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

    // Custom guardrail before the model call. Not part of the SDK.
    const latestUserText = extractLatestUserText(messages);
    const guardrail = checkUserInput(latestUserText);
    if (!guardrail.ok) {
      return reply.status(400).send({error: guardrail.reason});
    }

    // streamText handles the Ollama call, chunk parsing, and tool loop.
    const result = streamText({
      model: ollama(CHAT_MODEL_ID),
      system: CHAT_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: isStepCount(5),
    });

    // Model stream to UI chunks for useChat, plus SSE headers.
    // Fastify unwraps the Web Response status, headers, and body itself.
    return createUIMessageStreamResponse({
      stream: toUIMessageStream({stream: result.stream}),
    });
  });
};
