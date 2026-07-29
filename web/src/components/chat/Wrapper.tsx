import {lazy, Suspense, useState} from 'react';
import {useIsMobileViewport} from '@/hooks/useIsMobileViewport';
import {OpenButton} from './OpenButton';
import {ChatShell} from './ChatShell';

// Load the chat and its large deps only when opened.
const Layout = lazy(() =>
  import('./Layout').then((m) => ({default: m.Layout})),
);

export function Wrapper() {
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = useState(false);
  const [warm, setWarm] = useState(false);

  return (
    <>
      <OpenButton
        onOpen={isMobile ? undefined : () => setOpen(true)}
        onWarm={() => setWarm(true)}
      />
      <ChatShell open={open}>
        {warm && (
          <Suspense fallback={null}>
            <Layout onClose={isMobile ? undefined : () => setOpen(false)} />
          </Suspense>
        )}
      </ChatShell>
    </>
  );
}
