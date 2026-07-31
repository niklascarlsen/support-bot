import {lazy, Suspense, useState} from 'react';
import {useIsMobileViewport} from '@/hooks/useIsMobileViewport';
import {OpenButton} from './OpenButton';
import {ChatShell} from './ChatShell';
import {Header} from './Header';
import {Input} from './Input';

// Layout pulls in AI SDK and Streamdown. Keeps it off the initial page load.
const Layout = lazy(() =>
  import('./Layout').then((m) => ({default: m.Layout})),
);

function LayoutFallback({onClose}: {onClose?: () => void}) {
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
  const [open, setOpen] = useState(false);
  const [warm, setWarm] = useState(false);
  const onClose = isMobile ? undefined : () => setOpen(false);

  return (
    <>
      <OpenButton
        onOpen={isMobile ? undefined : () => setOpen(true)}
        onWarm={() => setWarm(true)}
      />
      <ChatShell open={open}>
        {warm && (
          <Suspense fallback={<LayoutFallback onClose={onClose} />}>
            <Layout onClose={onClose} />
          </Suspense>
        )}
      </ChatShell>
    </>
  );
}
