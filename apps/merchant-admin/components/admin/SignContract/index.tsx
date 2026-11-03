'use client';

import { useState } from 'react';
import { useFormState } from 'react-hook-form';
import { z } from 'zod';

import { Button, Checkbox, Dialog, Field, Form, Tooltip, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';

import FieldCaptcha from '../FieldCaptcha';

import styles from './SignContract.module.css';

const POLICY_TIP =
  '以下协议与纸质协议拥有同等效力，点击“确认合作”视为您同意并接受合作协议条款。如对合作条款有异议，可联系业务经理。';

const signSchema = z.object({
  captcha: z.string().regex(/^\d{6}$/, '请输入6位手机验证码'),
  policy: z.boolean().refine(value => value, '请勾选合作协议'),
});

export interface SignContractProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mobile: string;
  contractId: string;
  bizType?: number;
  state?: number;
}

function SignSubmitButton({ loading }: { loading: boolean }) {
  const { isSubmitting } = useFormState();

  return (
    <Button type='submit' className={styles.submit} loading={loading || isSubmitting}>
      确认合作
    </Button>
  );
}

export function SignContract({ open, onOpenChange, mobile, contractId, bizType, state }: SignContractProps) {
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const expired = bizType === 100 && state === 30;

  const handleSubmit = async () => {
    setLoading(true);

    try {
      await apiFetch<{ url: string }>('/api/venus/sign', {
        method: 'POST',
        body: { contractId },
      });

      toast.success('恭喜您与平台达成合作');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '签署合约异常');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title='签约合作协议'>
      <div className={styles.box}>
        <div className={styles.alert} role='alert'>
          {expired
            ? '您的协议已到期，我们将通过短信验证来确认您与平台继续达成合作'
            : '我们将通过短信验证来确认您与平台正式达成合作'}
        </div>

        <p className={styles.tip}>
          验证码将发送到 <strong>{mobile}</strong>，如需更换手机号请联系招商经理
        </p>

        <Form
          schema={signSchema}
          defaultValues={{ captcha: '', policy: false }}
          onSubmit={handleSubmit}
          className={styles.form}
        >
          <Field label='验证码' required>
            <FieldCaptcha name='captcha' mobile={mobile} placeholder='请输入验证码' />
          </Field>

          <Checkbox
            name='policy'
            className={styles.policy}
            label={
              <>
                我已阅读并同意<span className={styles.policyName}>《开源电商合作协议》</span>
                <Tooltip content={POLICY_TIP}>
                  <span
                    className={styles.info}
                    role='button'
                    tabIndex={0}
                    aria-label='协议说明'
                    onClick={event => {
                      event.preventDefault();
                      event.stopPropagation();
                    }}
                    onKeyDown={event => {
                      if (event.key === ' ' || event.key === 'Enter') {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                    }}
                  >
                    ⓘ
                  </span>
                </Tooltip>
              </>
            }
          />

          <SignSubmitButton loading={loading} />
        </Form>
      </div>
    </Dialog>
  );
}

export default SignContract;
