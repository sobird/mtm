import EntryBanner from '../EntryBanner';
import EntryInvitationForm from '../EntryInvitationForm';
import EntrySteps from '../EntrySteps';
import EntryWarningAlert from '../EntryWarningAlert';

import styles from './EntryHome.module.css';

export function EntryHome() {
  return (
    <div className={styles.home}>
      <EntryBanner />
      <EntrySteps />
      <EntryInvitationForm />
      <EntryWarningAlert />
    </div>
  );
}

export default EntryHome;
