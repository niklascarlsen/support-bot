import 'server-only';
import type {UIMessage} from 'ai';
import {appendTrace} from '@/lib/trace-log';

// In-memory per process. Lost on restart, not shared across replicas.
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
  appendTrace(chatId, messages.slice(chats.get(chatId)?.length ?? 0));
  chats.set(chatId, messages);
}
