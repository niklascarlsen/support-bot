import {useRef} from 'react';
import {useIsMobileViewport} from '@/hooks/useIsMobileViewport';
import {useScrollLock} from '@/hooks/useScrollLock';

export function ChatShell({
  open,
  children,
}: {
  open: boolean;
  children: React.ReactNode;
}) {
  const isMobile = useIsMobileViewport();
  const dialogRef = useRef<HTMLDialogElement>(null);

  useScrollLock(dialogRef);

  if (isMobile) {
    return (
      <dialog
        ref={dialogRef}
        id='chat-modal'
        closedby='any'
        tabIndex={-1}
        aria-labelledby='chat-widget-title'
      >
        {children}
      </dialog>
    );
  }

  return (
    <aside
      id='chat-panel'
      className={`chat-panel${open ? ' is-open' : ''}`}
      aria-labelledby='chat-widget-title'
      aria-hidden={!open}
      inert={open ? undefined : true}
    >
      {children}
    </aside>
  );
}
