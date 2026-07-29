import {useMemo} from 'react';
import {useChat as useAiChat} from '@ai-sdk/react';
import {DefaultChatTransport} from 'ai';

const API_URL = import.meta.env.VITE_CHAT_API_URL ?? '/api/chat';

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

  return useAiChat({transport});
}
