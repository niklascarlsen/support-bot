import type {WidgetConfig} from '@/lib/config';
import {useChat} from '@/hooks/useChat';
import {useChatScroll} from '@/hooks/useChatScroll';
import {Header} from './Header';
import {MessageList} from './MessageList';
import {Welcome} from './Welcome';
import {Input} from './Input';
import {ScrollButton} from './ScrollButton';

export function Layout({
  onClose,
  isOpen,
  config,
}: {
  onClose: () => void;
  isOpen: boolean;
  config: WidgetConfig;
}) {
  const {messages, sendMessage, status, setMessages, errorText, stop} =
    useChat();
  const isBusy = status === 'submitted' || status === 'streaming';
  const {scrollRef, contentRef, scrollToBottom, isNearBottom, isFollowing} =
    useChatScroll();

  const send = (text: string) => {
    scrollToBottom('auto');
    void sendMessage({text});
  };

  return (
    <div className='relative flex h-full min-h-0 flex-col overflow-hidden bg-white'>
      <Header
        onClose={onClose}
        onNewChat={() => {
          if (isBusy) stop();
          setMessages([]);
        }}
      />
      <main
        ref={scrollRef}
        className='flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain max-md:touch-pan-y outline-black -outline-offset-2'
      >
        <div ref={contentRef}>
          {isOpen && (
            <Welcome
              welcomeMessage={config.welcomeMessage}
              iceBreakers={messages.length === 0 ? config.iceBreakers : []}
              onPick={send}
              animate={messages.length === 0}
            />
          )}
          <MessageList
            messages={messages}
            isWaiting={status === 'submitted'}
            isStreaming={status === 'streaming'}
          />
          {errorText && <p className='px-4 pb-3 text-sm'>{errorText}</p>}
        </div>
      </main>
      {!isNearBottom && !isFollowing && (
        <ScrollButton scrollToBottom={scrollToBottom} />
      )}
      <Input isBusy={isBusy} onStop={stop} onSend={send} />
    </div>
  );
}
