'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import 'dayjs/locale/zh-cn';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ToastProvider } from '@/components/ui/Toast';

dayjs.locale('zh-cn');

/** Mirrors `styles/tokens.css` so antd components share the design tokens. */
const ANTD_THEME = {
  token: {
    colorPrimary: '#ffd100',
    colorTextLightSolid: '#1a1a1a',
    colorText: '#1f1f1f',
    colorTextSecondary: '#8c8c8c',
    colorBorder: '#d9d9d9',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    borderRadius: 4,
  },
};

export default function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <ConfigProvider locale={zhCN} theme={ANTD_THEME}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
