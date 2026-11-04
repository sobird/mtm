import { getTranslations } from 'next-intl/server';

import styles from './EntrySteps.module.css';

export async function EntrySteps() {
  const t = await getTranslations('entry.steps');

  const STEPS = [
    {
      number: '01.',
      title: t('prepare.title'),
      items: [t('prepare.item1'), t('prepare.item2'), t('prepare.item3')],
    },
    {
      number: '02.',
      title: t('chooseType.title'),
      items: [t('chooseType.item1'), t('chooseType.item2'), t('chooseType.item3')],
    },
    {
      number: '03.',
      title: t('apply.title'),
      items: [t('apply.item1'), t('apply.item2'), t('apply.item3')],
    },
    {
      number: '04.',
      title: t('review.title'),
      items: [t('review.item1'), t('review.item2'), t('review.item3')],
    },
    {
      number: '05.',
      title: t('operate.title'),
      items: [t('operate.item1'), t('operate.item2'), t('operate.item3')],
    },
  ];

  return (
    <div className={styles.steps}>
      {STEPS.map((step, index) => (
        <div className={`${styles.step} ${styles[`step${index + 1}`]}`} key={step.number}>
          <h3>
            <span>{step.number}</span>
            {step.title}
          </h3>
          <div className={styles.desc}>
            {step.items.map(item => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export default EntrySteps;
