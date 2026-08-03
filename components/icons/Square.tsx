import {Icon} from './Icon';
import type {IconProps} from './types';

export function Square(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M3 3v18h18V3Z' fill='currentColor' stroke='none' />
    </Icon>
  );
}
