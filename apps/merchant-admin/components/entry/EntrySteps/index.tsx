import styles from './EntrySteps.module.css';

const STEPS = [
  {
    number: '01.',
    title: '准备入驻资料',
    items: ['准备店铺信息', '准备经营资质', '开店铺人证件'],
  },
  {
    number: '02.',
    title: '选择店铺类型',
    items: ['店铺类型了解', '明确资质要求', '确认店铺类型'],
  },
  {
    number: '03.',
    title: '填写入驻申请',
    items: ['主体信息', '资质证件', '经营信息'],
  },
  {
    number: '04.',
    title: '提交等待审核',
    items: ['招商初审', '证件复审', '账户开户'],
  },
  {
    number: '05.',
    title: '开店线上经营',
    items: ['发布商品信息', '设置提现账户', '线上售卖经营'],
  },
];

export function EntrySteps() {
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
