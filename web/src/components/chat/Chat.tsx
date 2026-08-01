import {lazy, Suspense, useEffect, useRef, useState} from 'react';
import {useIsMobileViewport} from '@/hooks/useIsMobileViewport';
import {useScrollLock} from '@/hooks/useScrollLock';
import {OpenButton} from './OpenButton';
import {Header} from './Header';
import {Input} from './Input';

// Layout pulls in AI SDK and Streamdown. Keeps it off the initial page load.
const Layout = lazy(() =>
  import('./Layout').then((m) => ({default: m.Layout})),
);

function LayoutFallback({onClose}: {onClose: () => void}) {
  return (
    <div className='flex h-full min-h-0 flex-col overflow-hidden bg-white'>
      <Header onClose={onClose} />
      <main className='flex-1 min-h-0 min-w-0'></main>
      <Input disabled onSend={() => {}} />
    </div>
  );
}

export function Wrapper() {
  const isMobile = useIsMobileViewport();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [warm, setWarm] = useState(false);

  useScrollLock(isOpen && isMobile);

  const open = () =>
    isMobile ? dialogRef.current?.showModal() : dialogRef.current?.show();
  const close = () => dialogRef.current?.close();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog?.open || dialog.matches(':modal') === isMobile) return;

    const focused = document.activeElement;
    dialog.close();
    if (isMobile) dialog.showModal();
    else dialog.show();
    if (focused instanceof HTMLElement && dialog.contains(focused)) {
      focused.focus();
    }
  }, [isMobile]);

  return (
    <>
      <OpenButton onOpen={open} onWarm={() => setWarm(true)} />
      <dialog
        ref={dialogRef}
        id='chat-widget'
        onToggle={() => setIsOpen(dialogRef.current?.open ?? false)}
        closedby={isMobile ? 'any' : 'closerequest'}
        tabIndex={-1}
        aria-labelledby='chat-widget-title'
      >
        {warm && (
          <Suspense fallback={<LayoutFallback onClose={close} />}>
            <Layout onClose={close} isOpen={isOpen} />
          </Suspense>
        )}
      </dialog>
    </>
  );
}
