'use client';

import { signOut } from 'next-auth/react';

import { Button } from '@/components/ui';

import styles from './SettleinpcNotice.module.css';

export function SettleinpcNotice() {
  return (
    <div className={styles.page}>
      <div className={styles.box}>
        抱歉，您当前登陆的手机号已经注册过店铺，请先点击退出登陆，然后更换一个新的手机号重新注册登陆即可。给您带来不便，还请谅解。
      </div>
      <Button
        size='lg'
        onClick={() => {
          void signOut({ callbackUrl: '/login' });
        }}
      >
        退出登录
      </Button>
    </div>
  );
}

export default SettleinpcNotice;
