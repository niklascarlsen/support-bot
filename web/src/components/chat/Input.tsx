import {useState} from 'react';
import {ArrowUp} from '@/icons/ArrowUp';
import {Square} from '@/icons/Square';

export function Input({
  isBusy,
  onSend,
  onStop,
}: {
  isBusy?: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}) {
  const [value, setValue] = useState('');
  const hasText = value.trim().length > 0;

  function submit() {
    const text = value.trim();
    if (!text || isBusy) return;
    onSend(text);
    setValue('');
  }

  return (
    <div className='shrink-0 px-4 pb-4 pt-1 md:pb-5'>
      <div className='relative'>
        <input
          type='text'
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder='Type your message here...'
          className='w-full border-0 border-b border-black/20 bg-transparent py-2.5 pr-9 pl-1 text-base md:text-sm font-medium outline-none focus:border-black'
        />
        {isBusy ? (
          <button
            type='button'
            aria-label='Stop generating'
            onClick={onStop}
            className='absolute right-0 top-[45%] -translate-y-1/2 size-7 grid place-content-center rounded-xs bg-black text-white'
          >
            <Square size={12} />
          </button>
        ) : (
          hasText && (
            <button
              type='button'
              aria-label='Send message'
              onClick={submit}
              className='absolute right-0 top-[45%] -translate-y-1/2 size-7 grid place-content-center rounded-xs bg-black text-white'
            >
              <ArrowUp size={15} />
            </button>
          )
        )}
      </div>
    </div>
  );
}
