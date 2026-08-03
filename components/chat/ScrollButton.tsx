import {ArrowDown} from '@/components/icons/ArrowDown';

interface ScrollButtonProps {
  scrollToBottom: (behavior?: ScrollBehavior) => void;
}

export const ScrollButton = ({scrollToBottom}: ScrollButtonProps) => {
  return (
    <div className='absolute bottom-20 left-1/2 z-20 -translate-x-1/2'>
      <button
        type='button'
        onClick={() => scrollToBottom()}
        aria-label='Scroll to latest message'
        className='grid h-8 w-8 place-content-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-md transition-colors hover:bg-slate-50'
      >
        <ArrowDown size={15} strokeWidth={2.5} />
      </button>
    </div>
  );
};
