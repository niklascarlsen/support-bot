import type {ComponentType, ReactNode} from 'react';
import type {IconProps} from '@/components/icons/types';

export function MessageRow({
  icon: Icon,
  isUser = false,
  className,
  children,
}: {
  icon: ComponentType<IconProps>;
  isUser?: boolean;
  className?: string;
  children: ReactNode;
}) {
  // One line-height tall, icon centered in it. Matches the first text line
  // whether leading is relaxed, default, or the body wraps later.
  const mark = (
    <span className='flex h-lh shrink-0 items-center'>
      <Icon size='1.15em' className='block' />
    </span>
  );
  const body = <div className='min-w-0'>{children}</div>;

  return (
    <div
      className={`flex items-start gap-2 text-sm leading-relaxed${
        className ? ` ${className}` : ''
      }`}
    >
      {isUser ? (
        <>
          {body}
          {mark}
        </>
      ) : (
        <>
          {mark}
          {body}
        </>
      )}
    </div>
  );
}
