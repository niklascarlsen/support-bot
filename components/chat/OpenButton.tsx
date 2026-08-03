import {ChatBubble} from '@/components/icons/ChatBubble';

export function OpenButton({onOpen}: {onOpen: () => void}) {
  return (
    <button
      type='button'
      aria-label='Open chat'
      aria-haspopup='dialog'
      onClick={onOpen}
      className='chat-open-button fixed right-0 bottom-18 rounded-none border border-black bg-white p-2'
    >
      <ChatBubble />
    </button>
  );
}
