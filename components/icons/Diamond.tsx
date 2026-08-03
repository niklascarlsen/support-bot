import {Icon} from './Icon';
import type {IconProps} from './types';

export function Diamond(props: IconProps) {
  return (
    <Icon {...props}>
      <path d='M12 3 21 12 12 21 3 12Z' fill='currentColor' stroke='none' />
    </Icon>
  );
}
