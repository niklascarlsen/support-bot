import {ChatBubble} from '@/components/icons/ChatBubble';

export function OpenButton({onOpen}: {onOpen: () => void}) {
  return (
    <button
      type='button'
      aria-label='Open chat'
      aria-haspopup='dialog'
      onClick={onOpen}
      className='chat-open-button bg-white rounded-none fixed bottom-18 right-0 p-2 border border-black'
    >
      <ChatBubble />
    </button>
  );
}
