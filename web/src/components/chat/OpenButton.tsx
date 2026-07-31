import {ChatBubble} from '@/icons/ChatBubble';

export function OpenButton({
  onOpen,
  onWarm,
}: {
  onOpen: () => void;
  onWarm?: () => void;
}) {
  return (
    <button
      type='button'
      aria-label='Open chat'
      aria-haspopup='dialog'
      onPointerEnter={onWarm}
      onFocus={onWarm}
      onPointerDown={onWarm}
      onClick={onOpen}
      className='chat-open-button bg-white rounded-none fixed bottom-18 right-0 p-2 border border-black'
    >
      <ChatBubble />
    </button>
  );
}
