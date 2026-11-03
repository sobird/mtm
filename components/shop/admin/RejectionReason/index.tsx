import styles from './RejectionReason.module.css';

/** Error-styled audit rejection block, mirroring the legacy `Reason` alert. */
export function RejectionReason() {
  return (
    <div role='alert' className={styles.reason}>
      <p className={styles.title}>审核不通过，原因如下：</p>
      <ol className={styles.list}>
        <li>不通过</li>
        <li>用户名填写错误哦</li>
      </ol>
    </div>
  );
}

export default RejectionReason;
