import 'server-only';
import type {UIMessage} from 'ai';

// In-memory store for local dev. Survives across requests in one Node process,
// but a restart clears everything and multiple instances do not share history.
// Later replace the Map with durable shared storage (Postgres or Redis). Keep
// loadChat and saveChat as the API so the chat route stays the same.
const chats = new Map<string, UIMessage[]>();

export function loadChat(id: string): UIMessage[] {
  return chats.get(id) ?? [];
}

export function saveChat({
  chatId,
  messages,
}: {
  chatId: string;
  messages: UIMessage[];
}): void {
  chats.set(chatId, messages);
}
