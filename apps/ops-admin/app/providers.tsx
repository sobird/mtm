'use client';

import { ToastProvider } from '@mtm/ui';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import 'dayjs/locale/zh-cn';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import type { ReactNode } from 'react';
import { useState } from 'react';

dayjs.locale('zh-cn');

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
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 4,
        },
      }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
