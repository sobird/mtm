'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import styles from './Toast.module.css';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastApi {
  success(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const TOAST_DURATION = 3_000;

const ToastContext = createContext<ToastApi | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());
  const nextId = useRef(0);

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  const show = useCallback(
    (type: ToastType, message: string) => {
      const id = nextId.current++;
      setToasts(prev => [...prev, { id, type, message }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), TOAST_DURATION)
      );
    },
    [dismiss]
  );

  useEffect(() => {
    const pendingTimers = timers.current;
    return () => {
      pendingTimers.forEach(timer => clearTimeout(timer));
      pendingTimers.clear();
    };
  }, []);

  const toast = useMemo<ToastApi>(
    () => ({
      success: message => show('success', message),
      error: message => show('error', message),
      info: message => show('info', message),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <output className={styles.container} aria-live='polite'>
        {toasts.map(item => (
          <div key={item.id} className={`${styles.toast} ${styles[item.type]}`}>
            {item.message}
          </div>
        ))}
      </output>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const toast = useContext(ToastContext);
  if (toast === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return toast;
}
