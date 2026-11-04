'use client';

import { useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Button, Dialog, Radio } from '@/components/ui';

import type { EntryTypeItem } from '../types';

import styles from './StoreTypeSelector.module.css';

export interface StoreTypeSelectorProps {
  types: EntryTypeItem[];
}

export function StoreTypeSelector({ types }: StoreTypeSelectorProps) {
  const t = useTranslations('entry.storeTypeSelector');
  const { control } = useFormContext();
  const poiType = useWatch({ control, name: 'poiType' });
  const initialized = useRef(false);
  const previous = useRef<string | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState('');

  useEffect(() => {
    const current = poiType === undefined || poiType === null || poiType === '' ? null : String(poiType);

    // The first run merely records the prefilled value; only later changes
    // should raise the informational dialog.
    if (!initialized.current) {
      initialized.current = true;
      previous.current = current;
      return;
    }

    if (current !== null && current !== previous.current) {
      const selected = types.find(item => String(item.poiType) === current);

      if (selected) {
        setSelectedName(selected.poiTypeName);
        setOpen(true);
      }
    }

    previous.current = current;
  }, [poiType, types]);

  return (
    <>
      <div className={styles.grid}>
        {types.map(item => (
          <Radio
            key={item.poiType}
            name='poiType'
            value={String(item.poiType)}
            showError={false}
            className={styles.card}
            label={
              <>
                <span className={styles.title}>
                  {t('enterprisePrefix')}
                  {item.poiTypeName}
                </span>
                <span className={styles.desc}>{item.poiTypeDesc}</span>
              </>
            }
          />
        ))}
      </div>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={t('confirmTitle', { name: selectedName })}
        footer={<Button onClick={() => setOpen(false)}>{t('confirm')}</Button>}
      >
        {t('changeTip')}
      </Dialog>
    </>
  );
}

export default StoreTypeSelector;
