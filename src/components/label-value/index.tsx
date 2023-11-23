/**
 * LabelValue
 *
 * sobird<i@sobird.me> at 2023/10/28 22:47:26 created.
 */

import { FC, ReactNode } from 'react';
import classNames from 'classnames';
import { nanoid } from 'nanoid';
import './index.scss';

interface LabelValueProps {
  label: ReactNode;
  value: ReactNode;
  colon?: boolean;
}

const LabelValue: FC<LabelValueProps> = ({ label, value, colon = true }) => {
  const htmlForId = nanoid();
  return (
    <div className={classNames('label-value', {
      'label-value-colon': colon,
    })}
    >
      <label htmlFor={htmlForId}>{label}</label>
      <span id={htmlForId}>{value}</span>
    </div>
  );
};

export default LabelValue;
