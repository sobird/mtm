import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import Providers from './providers';

import './globals.css';

export const metadata: Metadata = {
  title: '美团电商商家管理后台',
  description: '美团电商商家管理后台',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang='zh-CN'>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
