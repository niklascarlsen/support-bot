import type {UIMessage} from 'ai';
import {Streamdown} from 'streamdown';
import {REMEND} from './danglingMarkers';

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

  // Tool steps often produce an assistant message with no text yet.
  if (!isUser && !text) {
    if (!isAnimating) return null;

    return (
      <article className='flex justify-start'>
        <p className='px-1 text-sm text-slate-400'>Looking things up...</p>
      </article>
    );
  }

  return (
    <article className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-xl px-3.5 py-2 text-sm leading-relaxed ${
          isUser
            ? 'rounded-br-sm bg-black text-white '
            : 'max-w-full mb-6 text-slate-900'
        }`}
      >
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
    </article>
  );
}
