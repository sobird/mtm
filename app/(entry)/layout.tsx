import type { ReactNode } from 'react';

import { EntryHeader } from '@/components/entry/EntryHeader';

import styles from './entry.module.css';

export default function EntryLayout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.layout}>
      <EntryHeader />
      <div className={styles.body}>{children}</div>
    </div>
  );
}
