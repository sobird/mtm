'use client';

import { useFormContext, useFormState } from 'react-hook-form';

import FieldCaptcha from '@/components/admin/FieldCaptcha';
import FieldIdCard from '@/components/admin/FieldIdCard';
import FieldTermPicker from '@/components/admin/FieldTermPicker';
import FieldUploadFile from '@/components/admin/FieldUploadFile';
import { Button, Field, Form, Input, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { VenusOcrResult } from '@/lib/services/venus';
import { adminSchema } from '@/lib/validation/admin';

import styles from './AdminForm.module.css';

function normalizeValiddate(value: unknown): [boolean, string, string] {
  if (!Array.isArray(value)) {
    return [false, '', ''];
  }

  return [value[0] === true, value[1] ? String(value[1]) : '', value[2] ? String(value[2]) : ''];
}

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

function AdminFields() {
  const toast = useToast();
  const { setValue } = useFormContext();

  const handleIdCardUpload = async (res: { url: string }, index: number) => {
    if (index !== 0) {
      return;
    }

    try {
      // 身份证人像面才识别
      const info = await apiFetch<VenusOcrResult>('/api/venus/ocr', {
        method: 'POST',
        body: { image: res.url, type: 0 },
      });

      setValue('name', info.name ?? '', { shouldValidate: true });
      setValue('citizenId', info.citizenId ?? '', { shouldValidate: true });
      setValue('validdate', normalizeValiddate(info.validdate), { shouldValidate: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '证件识别失败，请手动填写');
    }
  };

  return (
    <>
      <Field label='证件类型'>
        <p className={styles.staticValue}>
          中国大陆居民身份证
          <span className={styles.muted}>(店铺管理员仅支持大陆居民身份证申请)</span>
        </p>
      </Field>

      <Field label='电子证件照' required>
        <FieldIdCard name='idCardPhotos' onUploadSuccess={handleIdCardUpload} />
      </Field>

      <Field label='管理员姓名' required>
        <Input name='name' placeholder='请保持与身份证件上的姓名一致' aria-label='管理员姓名' />
      </Field>

      <Field label='身份证件号' required>
        <Input name='citizenId' placeholder='请保持与身份证件上的证件号一致' aria-label='身份证件号' />
      </Field>

      <Field label='有效截止日' required>
        <FieldTermPicker name='validdate' />
      </Field>

      <Field label='管理员手机号' required>
        <Input name='mobile' placeholder='请填写管理员手机号' inputMode='numeric' aria-label='管理员手机号' />
      </Field>

      <Field label='验证码' required>
        <FieldCaptcha name='captcha' phoneName='mobile' placeholder='请查看手机短信，输入验证码' />
      </Field>

      <Field label='授权书' required>
        <FieldUploadFile name='authLetter' maxCount={1} accept='.jpg,.jpeg,.png,.gif,.bmp' maxSizeMB={10} />
        <ul className={styles.uploadNotes}>
          <li>当店铺管理员与法人不一致时，请上传管理员授权书</li>
          <li>请使用模板下载后加盖公司印章后上传</li>
          <li>支持上传1张文件，大小不得超过10MB</li>
          <li>格式支持JPG/JPEG/PNG/GIF/BPM</li>
        </ul>
      </Field>

      <AdminSubmitButton />
    </>
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
      defaultValues={{
        idCardPhotos: [],
        name: '',
        citizenId: '',
        validdate: [false],
        mobile: '',
        captcha: '',
        authLetter: [],
      }}
      onSubmit={handleSubmit}
      className={styles.form}
    >
      <AdminFields />
    </Form>
  );
}

export default AdminForm;
