import type {UIMessage} from 'ai';
import {Streamdown} from 'streamdown';
import {Diamond} from '@/components/icons/Diamond';
import {Square} from '@/components/icons/Square';
import {REMEND} from './danglingMarkers';
import {MessageRow} from './MessageRow';

const ANIMATED = {
  animation: 'fadeIn',
  sep: 'word',
  duration: 220,
  stagger: 0,
} as const;

const LINK_SAFETY = {enabled: false} as const;

function messageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === 'text')
    .map((part) => part.text)
    .join('');
}

export function MessageItem({
  message,
  isAnimating = false,
}: {
  message: UIMessage;
  isAnimating?: boolean;
}) {
  const isUser = message.role === 'user';
  const text = messageText(message);

  if (!isUser && !text) {
    if (!isAnimating) return null;

    return (
      <article className='mb-6 py-2'>
        <MessageRow icon={Diamond} className='text-slate-400'>
          <p>Looking things up...</p>
        </MessageRow>
      </article>
    );
  }

  return (
    <article
      className={`flex py-2 ${isUser ? 'mb-2 justify-end' : 'mb-6 justify-start'}`}
    >
      <MessageRow
        icon={isUser ? Square : Diamond}
        isUser={isUser}
        className={isUser ? 'max-w-[80%] wrap-break-word' : 'max-w-[95%]'}
      >
        <div>
          {isUser ? (
            text
          ) : (
            <Streamdown
              animated={ANIMATED}
              linkSafety={LINK_SAFETY}
              remend={REMEND}
              isAnimating={isAnimating}
            >
              {text}
            </Streamdown>
          )}
        </div>
      </MessageRow>
    </article>
  );
}
