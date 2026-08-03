import {useState} from 'react';
import {ArrowUp} from '@/components/icons/ArrowUp';
import {Square} from '@/components/icons/Square';

export function Input({
  isBusy,
  disabled,
  onSend,
  onStop,
}: {
  isBusy?: boolean;
  disabled?: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}) {
  const [value, setValue] = useState('');
  const hasText = value.trim().length > 0;

  function submit() {
    const text = value.trim();
    if (!text || isBusy || disabled) return;
    onSend(text);
    setValue('');
  }

  return (
    <div className='shrink-0 px-4 pt-1 pb-4 md:pb-5'>
      <div className='relative'>
        <input
          type='text'
          value={value}
          maxLength={100}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              submit();
            }
          }}
          placeholder='Ask anything'
          className='w-full border-0 border-b border-black/20 bg-transparent py-2.5 pr-9 pl-1 text-base font-medium outline-none focus:border-black disabled:cursor-not-allowed disabled:opacity-40 md:text-sm'
        />
        {isBusy ? (
          <button
            type='button'
            aria-label='Stop generating'
            onClick={onStop}
            className='absolute top-[45%] right-0 grid size-7 -translate-y-1/2 place-content-center rounded-xs bg-black text-white'
          >
            <Square size={12} />
          </button>
        ) : (
          hasText &&
          !disabled && (
            <button
              type='button'
              aria-label='Send message'
              onClick={submit}
              className='absolute top-[45%] right-0 grid size-7 -translate-y-1/2 place-content-center rounded-xs bg-black text-white'
            >
              <ArrowUp size={15} />
            </button>
          )
        )}
      </div>
    </div>
  );
}
