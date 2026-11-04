'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { ReactNode } from 'react';

import { Button, Dialog } from '@/components/ui';

import styles from './IdUploadDemo.module.css';

const DEMO_IMAGES = [
  '/assets/id_demo_1.png',
  '/assets/id_demo_2.png',
  '/assets/id_demo_3.png',
  '/assets/id_demo_4.png',
];

export function IdUploadDemo({ children }: { children: ReactNode }) {
  const t = useTranslations('entry.idUploadDemo');
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type='button' className={styles.link} onClick={() => setOpen(true)}>
        {children}
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('title')}
        footer={<Button onClick={() => setOpen(false)}>{t('confirm')}</Button>}
        className={styles.dialog}
      >
        <div className={styles.content}>
          <p>{t('copyNote')}</p>
          <div className={styles.images}>
            <img src={DEMO_IMAGES[0]} alt={t('alt1')} />
            <img src={DEMO_IMAGES[1]} alt={t('alt2')} />
          </div>
          <p>{t('holdingNote')}</p>
          <div className={styles.images}>
            <img src={DEMO_IMAGES[2]} alt={t('alt3')} />
            <img src={DEMO_IMAGES[3]} alt={t('alt4')} />
          </div>
          <p>
            <span className={styles.required}>*</span>
            {t('reminderNote')}
          </p>
        </div>
      </Dialog>
    </>
  );
}

export default IdUploadDemo;
