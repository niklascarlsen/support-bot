import {useState} from 'react';
import {useIsMobileViewport} from '@/hooks/useIsMobileViewport';
import {OpenButton} from './OpenButton';
import {ChatShell} from './ChatShell';
import {Layout} from './Layout';

export function Wrapper() {
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = useState(false);

  return (
    <>
      <OpenButton onOpen={isMobile ? undefined : () => setOpen(true)} />
      <ChatShell open={open}>
        <Layout onClose={isMobile ? undefined : () => setOpen(false)} />
      </ChatShell>
    </>
  );
}

