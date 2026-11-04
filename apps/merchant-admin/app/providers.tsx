'use client';

import type { Locale } from '@mtm/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App as AntdApp, ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import dayjs from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/zh-cn';
import type { ReactNode } from 'react';
import { useState } from 'react';

import { ToastProvider } from '@/components/ui/Toast';

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

export default function Providers({ children, locale }: { children: ReactNode; locale: Locale }) {
  dayjs.locale(locale === 'zh-CN' ? 'zh-cn' : 'en');

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
    <ConfigProvider locale={locale === 'zh-CN' ? zhCN : enUS} theme={ANTD_THEME}>
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>{children}</ToastProvider>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  );
}
