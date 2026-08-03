import {useMemo, useState} from 'react';
import {useChat as useAiChat} from '@ai-sdk/react';
import {DefaultChatTransport, generateId} from 'ai';

const API_URL = process.env.NEXT_PUBLIC_CHAT_API_URL ?? '/api/chat';

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

// Thin wrapper around AI SDK useChat.
// Sends only the chat id and the latest message. The server owns history.
export function useChat() {
  const [chatId, setChatId] = useState(generateId);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: API_URL,
        prepareSendMessagesRequest({messages, id}) {
          return {
            body: {
              id,
              message: messages[messages.length - 1],
            },
          };
        },
      }),
    [],
  );

  const chat = useAiChat({id: chatId, transport, throttle: 50});

  return {
    ...chat,
    errorText: toErrorText(chat.error),
    newChat: () => setChatId(generateId()),
  };
}
