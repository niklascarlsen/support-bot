import 'react';

declare module 'react' {
  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    commandfor?: string | undefined;
    command?: string | undefined;
  }
}
