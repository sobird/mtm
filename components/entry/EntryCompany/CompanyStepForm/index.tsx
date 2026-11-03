'use client';

import { Controller, useFormContext, useWatch } from 'react-hook-form';

import FieldIdCard from '@/components/admin/FieldIdCard';
import FieldTermPicker from '@/components/admin/FieldTermPicker';
import FieldUploadFile from '@/components/admin/FieldUploadFile';
import OcrUpload from '@/components/admin/OcrUpload';
import { Card, Checkbox, Field, Form, Input, Radio, Select, Textarea, useToast } from '@/components/ui';
import { ApiError, apiFetch } from '@/lib/api-client';
import type { VenusOcrResult } from '@/lib/services/venus';
import { companySchema } from '@/lib/validation/company';
import type { CompanyFormValues } from '@/lib/validation/company';

import IdUploadDemo from '../IdUploadDemo';
import type { MerchantOptions } from '../types';

import styles from './CompanyStepForm.module.css';

const ID_TYPE_OPTIONS = [
  { value: 1001, label: '中国大陆居民身份证' },
  { value: 1002, label: '海外护照' },
  { value: 1003, label: '港澳居民往来内地通行证' },
  { value: 1004, label: '台湾居民往来大陆通行证' },
];

const IMAGE_ACCEPT = '.jpg,.jpeg,.png,.gif,.bmp';
const FILE_ACCEPT = '.pdf,.ppt,.pptx,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp';

function toUrlArray(value: unknown): string[] {
  if (typeof value === 'string') {
    return value ? [value] : [];
  }

  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item !== '') : [];
}

function normalizeTerm(value: unknown): [boolean, string, string] {
  if (!Array.isArray(value)) {
    return [false, '', ''];
  }

  return [Boolean(value[0]), value[1] ? String(value[1]) : '', value[2] ? String(value[2]) : ''];
}

function record(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {};
}

export function buildCompanyDefaults(company: Record<string, unknown>): CompanyFormValues {
  const license = record(company.businessLicense);
  const legalPerson = record(company.legalPerson);

  return {
    company: {
      companyType: Number(company.companyType ?? 1),
      distChannel: Array.isArray(company.distChannel) ? company.distChannel.map(Number) : [],
      businessLicense: {
        url: typeof license.url === 'string' ? license.url : '',
        socialCreditCode: typeof license.socialCreditCode === 'string' ? license.socialCreditCode : '',
        name: typeof license.name === 'string' ? license.name : '',
        address: typeof license.address === 'string' ? license.address : '',
        term: normalizeTerm(license.term),
        capital: typeof license.capital === 'string' ? license.capital : '',
      },
      certificateTaxpayer: toUrlArray(company.certificateTaxpayer),
      certificateBankOpen: toUrlArray(company.certificateBankOpen ?? company.certificateBankopen),
      officeAddress: typeof company.officeAddress === 'string' ? company.officeAddress : '',
      companyDesc: typeof company.companyDesc === 'string' ? company.companyDesc : '',
      companyFile: toUrlArray(company.companyFile),
      legalPerson: {
        idType: Number(legalPerson.idType ?? 1001),
        name: typeof legalPerson.name === 'string' ? legalPerson.name : '',
        idNum: typeof legalPerson.idNum === 'string' ? legalPerson.idNum : '',
        term: normalizeTerm(legalPerson.term),
        mobile: legalPerson.mobile === undefined || legalPerson.mobile === null ? '' : String(legalPerson.mobile),
        idPhotos: toUrlArray(legalPerson.idPhotos),
      },
    },
  };
}

export interface CompanyStepFormProps {
  id: string;
  defaults: CompanyFormValues;
  options?: MerchantOptions;
  onSubmit: () => void;
}

export function CompanyStepForm({ id, defaults, options, onSubmit }: CompanyStepFormProps) {
  return (
    <Form id={id} schema={companySchema} defaultValues={defaults as never} onSubmit={onSubmit} className={styles.form}>
      <Card title='企业主体信息'>
        <div className={styles.section}>
          <CompanyTypeField options={options?.companyTypeList ?? []} />
          <DistChannelField options={options?.distChannelList ?? []} />

          <Field label='营业执照' required>
            <BusinessLicenseField />
            <ul className={styles.notes}>
              <li>请上传清晰的多证合一营业执照（统一社会信用代码）</li>
              <li>文件最多上传1张，大小不得超过20MB</li>
              <li>文件格式支持：JPG/JPEG/PNG/GIF/BPM</li>
              <li>
                企业主体需满足{' '}
                <a
                  className={styles.link}
                  target='_blank'
                  href='https://rules-center.meituan.com/rules-detail/602?commonType=2'
                  rel='noreferrer'
                >
                  美团电商平台入驻标准
                </a>{' '}
                要求
              </li>
            </ul>
          </Field>

          <Field label='一般纳税人资格证电子版'>
            <FieldUploadFile name='company.certificateTaxpayer' maxCount={1} accept={IMAGE_ACCEPT} maxSizeMB={20} />
            <ul className={styles.notes}>
              <li>请上传清晰的一般纳税人资格证，复印件需加盖公司印章</li>
              <li>文件最多上传1张，大小不得超过20MB</li>
              <li>文件格式支持：JPG/JPEG/PNG/GIF/BPM</li>
            </ul>
          </Field>

          <Field label='银行开户证明' required>
            <FieldUploadFile name='company.certificateBankOpen' maxCount={1} accept={IMAGE_ACCEPT} maxSizeMB={20} />
            <ul className={styles.notes}>
              <li>请上传清晰的证照，如果是复印件需加盖公司印章</li>
              <li>文件最多上传1张，大小不得超过20MB</li>
              <li>文件格式支持：JPG/JPEG/PNG/GIF/BPM</li>
              <li>上传银行开户许可证或基本存款账户信息扫描件</li>
            </ul>
          </Field>

          <Field label='办公地址' required>
            <Input name='company.officeAddress' placeholder='请填写真实的办公地址' aria-label='办公地址' />
          </Field>

          <Field label='公司简介' required>
            <Textarea
              name='company.companyDesc'
              maxLength={1000}
              rows={5}
              placeholder='可以从品牌定位、品牌产品线、市场占有率或年销量、品牌当下布局、品牌未来规划等方面介绍，最多不得超过1000字'
              aria-label='公司简介'
            />
            <FieldUploadFile name='company.companyFile' maxCount={10} accept={FILE_ACCEPT} maxSizeMB={50} />
            <ul className={styles.notes}>
              <li>支持上传相关公司介绍等相关资料附件</li>
              <li>文件最多上传10个，单个文件大小不得超过50MB</li>
              <li>文件格式支持：PDF/PPT/DOC/JPG/JPEG/PNG/GIF/BPM</li>
            </ul>
          </Field>
        </div>
      </Card>

      <Card title='法人证件信息'>
        <div className={styles.section}>
          <Field label='证件类型' required>
            <Select name='company.legalPerson.idType' options={ID_TYPE_OPTIONS} aria-label='证件类型' />
          </Field>

          <Field label='电子证件照' required>
            <LegalPersonIdCard />
            <p className={styles.help}>
              请上传手持证件正反面照，或身份证件的正反面彩色扫描照片，或正反面复印件加盖入驻主体鲜章，
              <IdUploadDemo>查看示例</IdUploadDemo>
            </p>
          </Field>

          <Field label='法人手机号' required>
            <Input
              name='company.legalPerson.mobile'
              placeholder='请填写法人手机号'
              aria-label='法人手机号'
              inputMode='numeric'
              maxLength={11}
            />
          </Field>
        </div>
      </Card>
    </Form>
  );
}

function CompanyTypeField({ options }: { options: MerchantOptions['companyTypeList'] }) {
  const { control } = useFormContext<CompanyFormValues>();

  return (
    <Field label='公司类型' required>
      <Controller
        name='company.companyType'
        control={control}
        render={({ field, fieldState }) => (
          <div className={styles.group}>
            {(options ?? []).map(item => (
              <Radio
                key={item.type}
                checked={Number(field.value) === item.type}
                label={item.name}
                showError={false}
                onChange={() => field.onChange(item.type)}
              />
            ))}
            {fieldState.error ? (
              <p role='alert' className={styles.error}>
                {fieldState.error.message}
              </p>
            ) : null}
          </div>
        )}
      />
    </Field>
  );
}

function DistChannelField({ options }: { options: MerchantOptions['distChannelList'] }) {
  const { control } = useFormContext<CompanyFormValues>();

  return (
    <Field label='销售渠道'>
      <Controller
        name='company.distChannel'
        control={control}
        render={({ field }) => {
          const selected = Array.isArray(field.value) ? field.value.map(Number) : [];

          return (
            <div className={styles.group}>
              {(options ?? []).map(item => (
                <Checkbox
                  key={item.type}
                  checked={selected.includes(item.type)}
                  label={item.name}
                  showError={false}
                  onChange={event => {
                    const next = event.target.checked
                      ? [...selected, item.type]
                      : selected.filter(value => value !== item.type);
                    field.onChange(next);
                  }}
                />
              ))}
            </div>
          );
        }}
      />
    </Field>
  );
}

function BusinessLicenseField() {
  const { control, setValue } = useFormContext<CompanyFormValues>();
  const url = useWatch({ control, name: 'company.businessLicense.url' });
  const socialCreditCode = useWatch({ control, name: 'company.businessLicense.socialCreditCode' });

  const handleOcr = (res: VenusOcrResult) => {
    setValue('company.businessLicense.socialCreditCode', res.number ?? '', { shouldValidate: true });
    setValue('company.businessLicense.name', res.name ?? '', { shouldValidate: true });
    setValue('company.businessLicense.address', res.address ?? '', { shouldValidate: true });
    setValue('company.businessLicense.term', normalizeTerm(res.term), { shouldValidate: true });
    setValue('company.businessLicense.capital', res.capital ?? '', { shouldValidate: true });
  };

  return (
    <>
      <OcrUpload name='company.businessLicense.url' type={1} onUploadSuccess={handleOcr} />

      {url || socialCreditCode ? (
        <div className={styles.subCard}>
          <h4 className={styles.subTitle}>请核对营业执照信息，若信息不符，请手动修改</h4>
          <Field label='统一社会信用代码' required>
            <Input
              name='company.businessLicense.socialCreditCode'
              placeholder='请填写营业执照上的注册号'
              aria-label='统一社会信用代码'
            />
          </Field>
          <Field label='公司名称' required>
            <Input
              name='company.businessLicense.name'
              placeholder='请按照营业执照，填写公司名称'
              aria-label='公司名称'
            />
          </Field>
          <Field label='经营地址' required>
            <Input
              name='company.businessLicense.address'
              placeholder='请按照营业执照，填写公司地址'
              aria-label='经营地址'
            />
          </Field>
          <Field label='营业期限' required>
            <FieldTermPicker name='company.businessLicense.term' rangePicker />
          </Field>
          <Field label='注册资金' required hint='若注册资金币种不是人民币，可按照当前汇率换算成人民币后进行填写'>
            <div className={styles.inputRow}>
              <Input name='company.businessLicense.capital' placeholder='请输入' aria-label='注册资金' />
              <span className={styles.suffix}>万元</span>
            </div>
          </Field>
        </div>
      ) : null}
    </>
  );
}

function LegalPersonIdCard() {
  const toast = useToast();
  const { setValue } = useFormContext<CompanyFormValues>();

  const handleUpload = async (res: { url: string }, index: number) => {
    if (index !== 0) {
      return;
    }

    try {
      // 身份证人像面才识别
      const info = await apiFetch<VenusOcrResult>('/api/venus/ocr', {
        method: 'POST',
        body: { image: res.url, type: 0 },
      });

      setValue('company.legalPerson.name', info.name ?? '', { shouldValidate: true });
      setValue('company.legalPerson.idNum', info.citizenId ?? '', { shouldValidate: true });
      setValue('company.legalPerson.term', normalizeTerm(info.validdate), { shouldValidate: true });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : '证件识别失败，请手动填写');
    }
  };

  return (
    <>
      <FieldIdCard name='company.legalPerson.idPhotos' onUploadSuccess={handleUpload} />
      <div className={styles.subCard}>
        <h4 className={styles.subTitle}>请核对身份信息，若信息不符合，可手动修改</h4>
        <Field label='姓名' required>
          <Input name='company.legalPerson.name' placeholder='请保持与身份证件上的姓名一致' aria-label='法人姓名' />
        </Field>
        <Field label='证件号码' required>
          <Input
            name='company.legalPerson.idNum'
            placeholder='请保持与身份证件上的证件号一致'
            aria-label='法人证件号码'
          />
        </Field>
        <Field label='有效截止日' required>
          <FieldTermPicker name='company.legalPerson.term' />
        </Field>
      </div>
    </>
  );
}

export default CompanyStepForm;
