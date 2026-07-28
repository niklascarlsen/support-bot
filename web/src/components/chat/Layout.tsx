import {Header} from './Header';
import {MessageList} from './MessageList';
import {Input} from './Input';

export function Layout({onClose}: {onClose?: () => void}) {
  return (
    <div className='flex h-full min-h-0 flex-col overflow-hidden bg-white'>
      <Header onClose={onClose} />
      <main className='flex-1 min-h-0 min-w-0 overflow-y-auto overflow-x-hidden overscroll-contain max-md:touch-pan-y outline-black -outline-offset-2'>
        <MessageList />
      </main>
      <Input />
    </div>
  );
}
