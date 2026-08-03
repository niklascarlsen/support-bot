import type {UIMessage} from 'ai';
import {Diamond} from '@/components/icons/Diamond';
import {MessageItem} from './MessageItem';
import {MessageRow} from './MessageRow';

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
    <div className='flex flex-col px-5'>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          isAnimating={Boolean(isStreaming) && message.id === lastAssistantId}
        />
      ))}
      {isWaiting && (
        <div className='mb-6 py-2'>
          <MessageRow icon={Diamond} className='animate-pulse'>
            <p>Creating response...</p>
          </MessageRow>
        </div>
      )}
    </div>
  );
}
