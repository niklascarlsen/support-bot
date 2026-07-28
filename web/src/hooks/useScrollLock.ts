import {useEffect, type RefObject} from 'react';

let originalBodyStyles: {
  position: string;
  top: string;
  width: string;
  overflow: string;
  paddingRight: string;
} | null = null;

let scrollY = 0;

function lockBodyScroll() {
  if (originalBodyStyles) return;

  const body = document.body;
  const html = document.documentElement;
  const computedStyle = window.getComputedStyle(body);
  const currentPaddingRight =
    Number.parseFloat(computedStyle.paddingRight) || 0;
  const scrollbarWidth = window.innerWidth - html.clientWidth;

  scrollY = window.scrollY;

  originalBodyStyles = {
    position: body.style.position,
    top: body.style.top,
    width: body.style.width,
    overflow: body.style.overflow,
    paddingRight: body.style.paddingRight,
  };

  body.style.position = 'fixed';
  body.style.top = `-${scrollY}px`;
  body.style.width = '100%';
  body.style.overflow = 'hidden';

  if (scrollbarWidth > 0) {
    body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
  }
}

function unlockBodyScroll() {
  if (!originalBodyStyles) return;

  const body = document.body;
  body.style.position = originalBodyStyles.position;
  body.style.top = originalBodyStyles.top;
  body.style.width = originalBodyStyles.width;
  body.style.overflow = originalBodyStyles.overflow;
  body.style.paddingRight = originalBodyStyles.paddingRight;

  window.scrollTo(0, scrollY);
  originalBodyStyles = null;
}

/** Locks page scroll while a native <dialog> is open. */
export function useScrollLock(
  dialogRef: RefObject<HTMLDialogElement | null>,
): void {
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const sync = () => {
      if (dialog.open) lockBodyScroll();
      else unlockBodyScroll();
    };

    dialog.addEventListener('toggle', sync);
    sync();

    return () => {
      dialog.removeEventListener('toggle', sync);
      unlockBodyScroll();
    };
  }, [dialogRef]);
}
