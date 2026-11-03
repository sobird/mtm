import styles from './EntryWarningAlert.module.css';

export function EntryWarningAlert() {
  return (
    <div className={styles.reminder}>
      <div className={styles.alert}>
        <div className={styles.content}>
          <p className={styles.message}>
            友情提示：拟入驻美团电商的商家您好，入驻时无需支付给任何招商服务商和第三方费用，请您知悉！
          </p>
          <p className={styles.description}>
            目前平台仅开放数码家电/办公、宠物生活、母婴玩具、服饰鞋包、运动户外、汽配摩托、医药健康类目的商家自入驻，其余类目邀约制入驻请勿提交申请。入驻审核时效预计在7个工作日内，感谢支持。
          </p>
        </div>
      </div>
    </div>
  );
}

export default EntryWarningAlert;
