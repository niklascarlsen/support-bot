import type {UIMessage} from 'ai';
import {MessageItem} from './MessageItem';

export function MessageList({
  messages,
  isWaiting,
  isStreaming,
}: {
  messages: UIMessage[];
  isWaiting?: boolean;
  isStreaming?: boolean;
}) {
  const lastAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === 'assistant')?.id;

  return (
    <div className='flex flex-col gap-2.5 px-3 py-4'>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isAnimating={Boolean(isStreaming) && message.id === lastAssistantId}
        />
      ))}
      {isWaiting && (
        <div className='text-sm text-slate-400 px-1 animate-pulse'>Thinking...</div>
      )}
    </div>
  );
}
