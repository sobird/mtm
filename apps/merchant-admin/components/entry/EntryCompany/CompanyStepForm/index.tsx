'use client';

import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller, useFormContext, useWatch } from 'react-hook-form';

import FieldIdCard from '@/components/admin/FieldIdCard';
import FieldTermPicker from '@/components/admin/FieldTermPicker';
import FieldUploadFile from '@/components/admin/FieldUploadFile';
import OcrUpload from '@/components/admin/OcrUpload';
import { Card, Checkbox, Field, Form, Input, Radio, Select, Textarea, useToast } from '@/components/ui';
import { apiFetch } from '@/lib/api-client';
import type { VenusOcrResult } from '@/lib/services/venus';
import { translateApiError } from '@/lib/translate-api-error';
import { createCompanySchema } from '@/lib/validation/company';
import type { CompanyFormValues } from '@/lib/validation/company';

import IdUploadDemo from '../IdUploadDemo';
import type { MerchantOptions } from '../types';

import styles from './CompanyStepForm.module.css';

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
  const t = useTranslations('entry.company');
  const tIdTypes = useTranslations('entry.idTypes');
  const tRoot = useTranslations();
  const schema = useMemo(() => createCompanySchema(tRoot), [tRoot]);

  const idTypeOptions = [
    { value: 1001, label: tIdTypes('mainland') },
    { value: 1002, label: tIdTypes('passport') },
    { value: 1003, label: tIdTypes('hkMacau') },
    { value: 1004, label: tIdTypes('taiwan') },
  ];

  return (
    <Form id={id} schema={schema} defaultValues={defaults as never} onSubmit={onSubmit} className={styles.form}>
      <Card title={t('subjectCardTitle')}>
        <div className={styles.section}>
          <CompanyTypeField options={options?.companyTypeList ?? []} />
          <DistChannelField options={options?.distChannelList ?? []} />

          <Field label={t('businessLicense')} required>
            <BusinessLicenseField />
            <ul className={styles.notes}>
              <li>{t('businessLicenseNote1')}</li>
              <li>{t('businessLicenseNote2')}</li>
              <li>{t('businessLicenseNote3')}</li>
              <li>{t('businessLicenseNote4')}</li>
            </ul>
          </Field>

          <Field label={t('taxpayer')}>
            <FieldUploadFile name='company.certificateTaxpayer' maxCount={1} accept={IMAGE_ACCEPT} maxSizeMB={20} />
            <ul className={styles.notes}>
              <li>{t('taxpayerNote1')}</li>
              <li>{t('taxpayerNote2')}</li>
              <li>{t('taxpayerNote3')}</li>
            </ul>
          </Field>

          <Field label={t('bankOpen')} required>
            <FieldUploadFile name='company.certificateBankOpen' maxCount={1} accept={IMAGE_ACCEPT} maxSizeMB={20} />
            <ul className={styles.notes}>
              <li>{t('bankOpenNote1')}</li>
              <li>{t('bankOpenNote2')}</li>
              <li>{t('bankOpenNote3')}</li>
              <li>{t('bankOpenNote4')}</li>
            </ul>
          </Field>

          <Field label={t('officeAddress')} required>
            <Input
              name='company.officeAddress'
              placeholder={t('officeAddressPlaceholder')}
              aria-label={t('officeAddress')}
            />
          </Field>

          <Field label={t('companyDesc')} required>
            <Textarea
              name='company.companyDesc'
              maxLength={1000}
              rows={5}
              placeholder={t('companyDescPlaceholder')}
              aria-label={t('companyDesc')}
            />
            <FieldUploadFile name='company.companyFile' maxCount={10} accept={FILE_ACCEPT} maxSizeMB={20} />
            <ul className={styles.notes}>
              <li>{t('companyFileNote1')}</li>
              <li>{t('companyFileNote2')}</li>
              <li>{t('companyFileNote3')}</li>
            </ul>
          </Field>
        </div>
      </Card>

      <Card title={t('legalPersonCardTitle')}>
        <div className={styles.section}>
          <Field label={t('idType')} required>
            <Select name='company.legalPerson.idType' options={idTypeOptions} aria-label={t('idType')} />
          </Field>

          <Field label={t('idPhotos')} required>
            <LegalPersonIdCard />
            <p className={styles.help}>
              {t('idPhotosHelp')}
              <IdUploadDemo>{t('viewExample')}</IdUploadDemo>
            </p>
          </Field>

          <Field label={t('legalPersonMobile')} required>
            <Input
              name='company.legalPerson.mobile'
              placeholder={t('legalPersonMobilePlaceholder')}
              aria-label={t('legalPersonMobile')}
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
  const t = useTranslations('entry.company');
  const { control } = useFormContext<CompanyFormValues>();

  return (
    <Field label={t('companyType')} required>
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
  const t = useTranslations('entry.company');
  const { control } = useFormContext<CompanyFormValues>();

  return (
    <Field label={t('distChannel')}>
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
  const t = useTranslations('entry.company');
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
          <h4 className={styles.subTitle}>{t('licenseVerifyTitle')}</h4>
          <Field label={t('socialCreditCode')} required>
            <Input
              name='company.businessLicense.socialCreditCode'
              placeholder={t('socialCreditCodePlaceholder')}
              aria-label={t('socialCreditCode')}
            />
          </Field>
          <Field label={t('companyName')} required>
            <Input
              name='company.businessLicense.name'
              placeholder={t('companyNamePlaceholder')}
              aria-label={t('companyName')}
            />
          </Field>
          <Field label={t('businessAddress')} required>
            <Input
              name='company.businessLicense.address'
              placeholder={t('businessAddressPlaceholder')}
              aria-label={t('businessAddress')}
            />
          </Field>
          <Field label={t('businessTerm')} required>
            <FieldTermPicker name='company.businessLicense.term' rangePicker />
          </Field>
          <Field label={t('registeredCapital')} required hint={t('registeredCapitalHint')}>
            <div className={styles.inputRow}>
              <Input
                name='company.businessLicense.capital'
                placeholder={t('registeredCapitalPlaceholder')}
                aria-label={t('registeredCapital')}
              />
              <span className={styles.suffix}>{t('registeredCapitalUnit')}</span>
            </div>
          </Field>
        </div>
      ) : null}
    </>
  );
}

function LegalPersonIdCard() {
  const t = useTranslations('entry.company');
  const tRoot = useTranslations();
  const toast = useToast();
  const { setValue } = useFormContext<CompanyFormValues>();

  const handleUpload = async (res: { url: string }, index: number) => {
    if (index !== 0) {
      return;
    }

    try {
      // Only recognize the portrait side of the ID card.
      const info = await apiFetch<VenusOcrResult>('/api/venus/ocr', {
        method: 'POST',
        body: { image: res.url, type: 0 },
      });

      setValue('company.legalPerson.name', info.name ?? '', { shouldValidate: true });
      setValue('company.legalPerson.idNum', info.citizenId ?? '', { shouldValidate: true });
      setValue('company.legalPerson.term', normalizeTerm(info.validdate), { shouldValidate: true });
    } catch (error) {
      toast.error(translateApiError(error, tRoot, 'entry.company.ocrFailed'));
    }
  };

  return (
    <>
      <FieldIdCard name='company.legalPerson.idPhotos' onUploadSuccess={handleUpload} />
      <div className={styles.subCard}>
        <h4 className={styles.subTitle}>{t('identityVerifyTitle')}</h4>
        <Field label={t('legalName')} required>
          <Input name='company.legalPerson.name' placeholder={t('legalNamePlaceholder')} aria-label={t('legalName')} />
        </Field>
        <Field label={t('idNumber')} required>
          <Input name='company.legalPerson.idNum' placeholder={t('idNumberPlaceholder')} aria-label={t('idNumber')} />
        </Field>
        <Field label={t('validUntil')} required>
          <FieldTermPicker name='company.legalPerson.term' />
        </Field>
      </div>
    </>
  );
}

export default CompanyStepForm;
