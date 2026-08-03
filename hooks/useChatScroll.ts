import {useCallback, useEffect, useRef, useState} from 'react';

export interface ChatScroll {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  contentRef: React.RefObject<HTMLDivElement | null>;
  scrollToBottom: (behavior?: ScrollBehavior) => void;
  isNearBottom: boolean;
  isFollowing: boolean;
}

// How far from the bottom the user has to be before a jump back is worth offering.
const BOTTOM_THRESHOLD_PX = 150;

// Pixels left before the container reaches the bottom.
function distanceFromBottom(container: HTMLElement): number {
  return container.scrollHeight - container.scrollTop - container.clientHeight;
}

function isAtBottom(container: HTMLElement): boolean {
  return distanceFromBottom(container) <= 2;
}

// Follows the bottom of a scroll container while its content grows.
// Any upward move stops the follow, returning to the bottom starts it again.
export function useChatScroll(): ChatScroll {
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const escapedRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [isFollowing, setIsFollowing] = useState(true);

  const setFollowing = useCallback((value: boolean) => {
    followingRef.current = value;
    if (value) escapedRef.current = false;
    setIsFollowing(value);
  }, []);

  const scrollToBottom = useCallback(
    (behavior: ScrollBehavior = 'smooth') => {
      const container = scrollRef.current;
      if (!container) return;

      setFollowing(true);

      if (behavior === 'auto') {
        container.scrollTop = container.scrollHeight;
        return;
      }

      container.scrollTo({top: container.scrollHeight, behavior});
    },
    [setFollowing],
  );

  useEffect(() => {
    const container = scrollRef.current;
    const content = contentRef.current;
    if (!container || !content) return;

    let previousHeight = 0;

    const observer = new ResizeObserver(([entry]) => {
      const height = entry.contentRect.height;
      const wasHidden = previousHeight === 0;
      const shrank = height < previousHeight;
      previousHeight = height;

      if (wasHidden && height > 0) {
        scrollToBottom('auto');
        return;
      }

      setIsNearBottom(distanceFromBottom(container) <= BOTTOM_THRESHOLD_PX);

      if (followingRef.current) {
        scrollToBottom('auto');
        return;
      }

      if (shrank && isAtBottom(container)) setFollowing(true);
    });

    const handleScroll = () => {
      const scrollTop = container.scrollTop;
      const scrolledUp = scrollTop < lastScrollTopRef.current;
      const scrolledDown = scrollTop > lastScrollTopRef.current;
      lastScrollTopRef.current = scrollTop;

      setIsNearBottom(distanceFromBottom(container) <= BOTTOM_THRESHOLD_PX);

      if (scrolledUp) {
        escapedRef.current = true;
        setFollowing(false);
        return;
      }

      if (scrolledDown) escapedRef.current = false;
      if (!escapedRef.current && isAtBottom(container)) setFollowing(true);
    };

    const handleWheel = (event: WheelEvent) => {
      const canScroll = container.scrollHeight > container.clientHeight;
      if (event.deltaY >= 0 || !canScroll) return;

      escapedRef.current = true;
      setFollowing(false);
    };

    observer.observe(content);
    container.addEventListener('scroll', handleScroll, {passive: true});
    container.addEventListener('wheel', handleWheel, {passive: true});

    return () => {
      observer.disconnect();
      container.removeEventListener('scroll', handleScroll);
      container.removeEventListener('wheel', handleWheel);
    };
  }, [scrollToBottom, setFollowing]);

  return {
    scrollRef,
    contentRef,
    scrollToBottom,
    isNearBottom,
    isFollowing,
  };
}
