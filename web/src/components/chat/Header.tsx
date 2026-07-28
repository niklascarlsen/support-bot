import {X} from '@/icons/X';
import {RotateCcw} from '@/icons/RotateCcw';

const iconButtonClassName =
  'h-8 w-8 grid place-content-center text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors';

export function Header({onClose}: {onClose?: () => void}) {
  return (
    <header className='flex shrink-0 justify-between items-center px-2 py-3'>
      <div>
        <button
          type='button'
          aria-label='Close chat'
          title='Close'
          className={iconButtonClassName}
          {...(onClose
            ? {onClick: onClose}
            : {commandfor: 'chat-modal', command: 'close'})}
        >
          <X />
        </button>
      </div>
      <h2
        id='chat-widget-title'
        className='text-center text-sm font-semibold text-slate-900 uppercase'
      >
        Nova
      </h2>
      <div className='flex justify-end'>
        <button
          type='button'
          aria-label='Start a new chat'
          title='New chat'
          className={`${iconButtonClassName} disabled:opacity-40 disabled:hover:bg-transparent`}
        >
          <RotateCcw  />
        </button>
      </div>
    </header>
  );
}
