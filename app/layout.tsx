import type {Metadata} from 'next';
import {Arimo} from 'next/font/google';
import 'streamdown/styles.css';
import './globals.css';

const arimo = Arimo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-arimo',
});

export const metadata: Metadata = {
  title: 'Prestige Worldwide',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang='en' className={arimo.variable}>
      <body>{children}</body>
    </html>
  );
}
