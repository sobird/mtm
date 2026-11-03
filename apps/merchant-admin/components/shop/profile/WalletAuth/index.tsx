'use client';

import { useEffect, useState } from 'react';

import { Button, Dialog, Field, Form, Input, Steps, useToast } from '@/components/ui';
import { walletAuthSchema } from '@/lib/validation/profile';

import styles from './WalletAuth.module.css';

export interface WalletAuthProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const FORM_ID = 'wallet-auth-form';
const STEP_ITEMS = [
  { key: 'admin', title: '管理员认证' },
  { key: 'confirm', title: '确认钱包信息' },
];

export function WalletAuth({ open, onOpenChange }: WalletAuthProps) {
  const toast = useToast();
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!open) {
      setStep(0);
    }
  }, [open]);

  const footer =
    step === 0 ? (
      <>
        <Button variant='secondary' onClick={() => onOpenChange(false)}>
          取消
        </Button>
        <Button type='submit' form={FORM_ID}>
          下一步
        </Button>
      </>
    ) : (
      <>
        <Button variant='secondary' onClick={() => setStep(0)}>
          上一步
        </Button>
        <Button type='submit' form={FORM_ID}>
          确认
        </Button>
      </>
    );

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title='变更为个人钱包' footer={footer}>
      <div role='alert' className={styles.warning}>
        更换钱包，原钱包余额不会自动转入新钱包，建议先提现再更换
      </div>

      <Steps items={STEP_ITEMS} current={step} className={styles.steps} />

      <Form
        id={FORM_ID}
        schema={walletAuthSchema}
        defaultValues={{ companyName: '', companyIdCard: '', phone: '', captcha: '' }}
        onSubmit={() => {
          if (step === 0) {
            setStep(1);
            return;
          }

          toast.success('钱包变更申请已提交');
          onOpenChange(false);
        }}
        className={styles.form}
      >
        <Field label='企业名称' required>
          <Input name='companyName' placeholder='请输入企业名称' aria-label='企业名称' />
        </Field>

        <Field label='企业证件号' required>
          <Input name='companyIdCard' placeholder='请输入企业证件号' aria-label='企业证件号' />
        </Field>

        <Field label='钱包绑定手机' required>
          <Input name='phone' placeholder='请输入手机号' inputMode='numeric' aria-label='钱包绑定手机' />
        </Field>

        <Field label='验证码' required>
          <Input name='captcha' placeholder='请输入验证码' inputMode='numeric' aria-label='验证码' />
        </Field>
      </Form>
    </Dialog>
  );
}

export default WalletAuth;
