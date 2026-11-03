'use client';

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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type='button' className={styles.link} onClick={() => setOpen(true)}>
        {children}
      </button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title='身份证件上传示例'
        footer={<Button onClick={() => setOpen(false)}>我知道了</Button>}
        className={styles.dialog}
      >
        <div className={styles.content}>
          <p>1. 身份证件正反面复印件，加盖开店公司印章：</p>
          <div className={styles.images}>
            <img src={DEMO_IMAGES[0]} alt='身份证件示例1' />
            <img src={DEMO_IMAGES[1]} alt='身份证件示例2' />
          </div>
          <p>2. 手持身份证件的正反面照片：</p>
          <div className={styles.images}>
            <img src={DEMO_IMAGES[2]} alt='身份证件示例3' />
            <img src={DEMO_IMAGES[3]} alt='身份证件示例4' />
          </div>
          <p>
            <span className={styles.required}>*</span>
            注：身份信息请勿打马赛克，请保持所有字迹清晰可见
          </p>
        </div>
      </Dialog>
    </>
  );
}

export default IdUploadDemo;
