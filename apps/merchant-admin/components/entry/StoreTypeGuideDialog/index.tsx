'use client';

import { useTranslations } from 'next-intl';

import { Button, Dialog } from '@/components/ui';

import styles from './StoreTypeGuideDialog.module.css';

interface GuideRow {
  key: number;
  poiTypeName: string;
  poiTypeDesc: string;
}

function getRowSpans(rows: GuideRow[]): number[] {
  const spans = rows.map(() => 0);
  let index = 0;

  while (index < rows.length) {
    let end = index;

    while (end < rows.length && rows[end].poiTypeName === rows[index].poiTypeName) {
      end += 1;
    }

    spans[index] = end - index;
    index = end;
  }

  return spans;
}

export interface StoreTypeGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StoreTypeGuideDialog({ open, onOpenChange }: StoreTypeGuideDialogProps) {
  const t = useTranslations('entry.storeTypeGuide');
  const rows: GuideRow[] = [
    { key: 1, poiTypeName: t('names.flagship'), poiTypeDesc: t('rows.1') },
    { key: 2, poiTypeName: t('names.flagship'), poiTypeDesc: t('rows.2') },
    { key: 3, poiTypeName: t('names.flagship'), poiTypeDesc: t('rows.3') },
    { key: 4, poiTypeName: t('names.franchise'), poiTypeDesc: t('rows.4') },
    { key: 5, poiTypeName: t('names.franchise'), poiTypeDesc: t('rows.5') },
    { key: 6, poiTypeName: t('names.exclusive'), poiTypeDesc: t('rows.6') },
    { key: 7, poiTypeName: t('names.exclusive'), poiTypeDesc: t('rows.7') },
    { key: 8, poiTypeName: t('names.exclusive'), poiTypeDesc: t('rows.8') },
    { key: 9, poiTypeName: t('names.factory'), poiTypeDesc: t('rows.9') },
    { key: 10, poiTypeName: t('names.factory'), poiTypeDesc: t('rows.10') },
    { key: 11, poiTypeName: t('names.factory'), poiTypeDesc: t('rows.11') },
  ];
  const rowSpans = getRowSpans(rows);

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('title')}
      className={styles.dialog}
      footer={<Button onClick={() => onOpenChange(false)}>{t('confirm')}</Button>}
    >
      <table className={styles.table}>
        <thead>
          <tr>
            <th scope='col'>{t('typeColumn')}</th>
            <th scope='col'>{t('descriptionColumn')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.key}>
              {rowSpans[index] > 0 ? (
                <td rowSpan={rowSpans[index]} className={styles.typeName}>
                  {row.poiTypeName}
                </td>
              ) : null}
              <td>{row.poiTypeDesc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Dialog>
  );
}

export default StoreTypeGuideDialog;
