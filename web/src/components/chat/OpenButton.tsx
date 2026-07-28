import {ChatBubble} from '@/icons/ChatBubble';

export function OpenButton({onOpen}: {onOpen?: () => void}) {
  return (
    <button
      type='button'
      aria-label='Open chat'
      className='chat-open-button bg-white rounded-none fixed bottom-18 right-0 p-2 border border-black'
      {...(onOpen
        ? {onClick: onOpen}
        : {commandfor: 'chat-modal', command: 'show-modal'})}
    >
      <ChatBubble />
    </button>
  );
}
