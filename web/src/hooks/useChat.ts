import {useMemo} from 'react';
import {useChat as useAiChat} from '@ai-sdk/react';
import {DefaultChatTransport} from 'ai';

const API_URL = import.meta.env.VITE_CHAT_API_URL ?? '/api/chat';

// On error, extract "error" from API response if present.
// Guardrail refusals are streamed as normal messages, not errors.
function toErrorText(error: Error | undefined): string | undefined {
  if (!error) return undefined;

  // The generic text below hides what actually broke, so keep the real one.
  console.error('chat request failed', error);

  try {
    const body = JSON.parse(error.message) as {error?: unknown};
    if (typeof body.error === 'string') return body.error;
  } catch {
    // Not our JSON shape, fall through to the generic text.
  }

  return 'Something went wrong.';
}

/**
 * Thin wrapper around AI SDK useChat.
 * Handles POST + UI message stream parsing against the Fastify backend.
 */
export function useChat() {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API_URL,
      }),
    [],
  );

  // Throttle to prevent too many React renders per stream.
  const chat = useAiChat({transport, throttle: 50});

  return {...chat, errorText: toErrorText(chat.error)};
}
