/**
 * 身份证上传表单字段
 * 
 * @todo
 * 优化 onChange
 *
 * sobird<i@sobird.me> at 2023/10/26 15:54:14 created.
 */

import React, {FC} from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { Space } from 'antd';
import UploadFile from '@/components/field-upload-file';
import IdCardSketch1 from './assets/idcard_1.png';
import IdCardSketch2 from './assets/idcard_2.png';

import './index.scss';

type ValuePair = [string, string];

interface FieldIdCardProps {
  value?: ValuePair;
  defaultValue?: ValuePair;
  onChange?: (params: ValuePair) => void;
  status: 4 | 5 | 6;
}

const FieldIdCard: FC<FieldIdCardProps> = ({ value, defaultValue = [], onChange }) => {
  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value,
    onChange,
  });

  console.log('valuePair', valuePair)

  return (
    <Space className='field-id-card'>
      <UploadFile
        value={[valuePair[0]]}
        onChange={(value) => {
          console.log('valuePair123', value)
          valuePair[0] = value[0];

          console.log('valuePair', valuePair)
          setValuePair(valuePair);
        }}

        // beforeUpload={async (file) => {
        //   const result = await fileValidator(file);

        //   if(!result) {
        //     return Upload.LIST_IGNORE;
        //   }
        // }}

        autoHidden
        maxCount={1}
        listType='picture-card'
        accept='image/*'
      >
        <img src={IdCardSketch1} />
        <span className="id-card-tips">人像面</span>
      </UploadFile>

      <UploadFile
        value={[valuePair[1]]}
        onChange={(value) => {
          valuePair[1] = value[0];
          setValuePair(valuePair);
        }}
        autoHidden
        maxCount={1}
        listType='picture-card'
        accept='image/*'
      >
        <img src={IdCardSketch2} />
        <span className="id-card-tips">国徽面</span>
      </UploadFile>
    </Space>
  );
};

export default FieldIdCard;
