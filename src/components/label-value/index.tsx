/**
 * LabelValue
 *
 * sobird<i@sobird.me> at 2023/10/28 22:47:26 created.
 */

import React, { FC, ReactNode } from 'react';
import classNames from 'classnames';
import './index.scss';

interface LabelValueProps {
  label: ReactNode;
  value: ReactNode;
  colon?: boolean;
}

const LabelValue: FC<LabelValueProps> = ({ label, value, colon = true }) => {
  return (
    <div className={classNames('label-value', {
      "label-value-colon": colon
    })}>
      <label>{label}</label>
      <span>{value}</span>
    </div>
  );
};

export default LabelValue;
