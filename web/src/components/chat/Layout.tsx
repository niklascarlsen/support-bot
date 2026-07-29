import {useChat} from '@/hooks/useChat';
import {Header} from './Header';
import {MessageList} from './MessageList';
import {Input} from './Input';

export function Layout({onClose}: {onClose?: () => void}) {
  const {messages, sendMessage, status, setMessages, error, stop} = useChat();
  const isBusy = status === 'submitted' || status === 'streaming';

  return (
    <div className='flex h-full min-h-0 flex-col overflow-hidden bg-white'>
      <Header
        onClose={onClose}
        onNewChat={() => {
          if (isBusy) stop();
          setMessages([]);
        }}
      />
      <main className='flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain max-md:touch-pan-y outline-black -outline-offset-2'>
        <MessageList
          messages={messages}
          isWaiting={status === 'submitted'}
          isStreaming={status === 'streaming'}
        />
        {error && (
          <p className='px-4 pb-3 text-sm text-red-600'>
            Something went wrong.
          </p>
        )}
      </main>
      <Input
        isBusy={isBusy}
        onStop={stop}
        onSend={(text) => {
          void sendMessage({text});
        }}
      />
    </div>
  );
}
