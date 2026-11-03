'use client';

import { useFormState } from 'react-hook-form';

import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { adminSchema } from '@/lib/validation/admin';

import styles from './AdminForm.module.css';

function AdminSubmitButton() {
  const { isSubmitting } = useFormState();

  return (
    <div className={styles.actions}>
      <Button type='submit' loading={isSubmitting}>
        更新店铺管理员信息
      </Button>
    </div>
  );
}

export function AdminForm() {
  const toast = useToast();

  const handleSubmit = () => {
    toast.success('店铺管理员信息已保存');
  };

  return (
    <Form
      schema={adminSchema}
      defaultValues={{ name: '', citizenId: '', validdate: '', mobile: '', captcha: '' }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <Field label='证件类型'>
        <p className={styles.staticValue}>
          中国大陆居民身份证
          <span className={styles.muted}>(店铺管理员仅支持大陆居民身份证申请)</span>
        </p>
      </Field>

      <Field label='电子证件照' required>
        <div className={styles.uploadPlaceholder} aria-disabled='true'>
          电子证件照上传组件将在后续版本接入
        </div>
      </Field>

      <Field label='管理员姓名' required>
        <Input name='name' placeholder='请保持与身份证件上的姓名一致' aria-label='管理员姓名' />
      </Field>

      <Field label='身份证件号' required>
        <Input name='citizenId' placeholder='请保持与身份证件上的证件号一致' aria-label='身份证件号' />
      </Field>

      <Field label='有效截止日' required>
        <Input name='validdate' placeholder='请输入有效截止日' aria-label='有效截止日' />
      </Field>

      <Field label='管理员手机号' required>
        <Input name='mobile' placeholder='请填写管理员手机号' inputMode='numeric' aria-label='管理员手机号' />
      </Field>

      <Field label='验证码' required>
        <Input name='captcha' placeholder='请查看手机短信，输入验证码' inputMode='numeric' aria-label='验证码' />
      </Field>

      <Field label='授权书' required>
        <div>
          <div className={styles.uploadPlaceholder} aria-disabled='true'>
            授权书上传组件将在后续版本接入
          </div>
          <ul className={styles.uploadNotes}>
            <li>当店铺管理员与法人不一致时，请上传管理员授权书</li>
            <li>请使用模板下载后加盖公司印章后上传</li>
            <li>支持上传1张文件，大小不得超过10MB</li>
            <li>格式支持JPG/JPEG/PNG/GIF/BPM</li>
          </ul>
        </div>
      </Field>

      <AdminSubmitButton />
    </Form>
  );
}

export default AdminForm;
