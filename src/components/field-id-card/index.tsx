/**
 * 身份证上传表单字段
 *
 * @todo
 * 优化 onChange
 *
 * sobird<i@sobird.me> at 2023/10/26 15:54:14 created.
 */

import { FC } from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { Space, message, Upload } from 'antd';
import type { RcFile } from 'antd/es/upload';
import FieldUploadFile, { FieldUploadFileProps } from '@/components/field-upload-file';
import { IVenusUploadResponse } from '@/services/common/venus';

import IdCardSketch1 from './assets/idcard_1.png';
import IdCardSketch2 from './assets/idcard_2.png';

import './index.scss';

type ValuePair = [string, string];

interface FieldIdCardProps extends Omit<FieldUploadFileProps, 'onUploadSuccess'> {
  value?: ValuePair;
  defaultValue?: ValuePair;
  onChange?: (params: ValuePair) => void;
  onUploadSuccess?: (res: IVenusUploadResponse, index: number) => void;
}

const fileValidator = async (file: RcFile) => {
  if (!file) {
    return;
  }
  if (file.size > 10000000) {
    message.error('照片大小不能超过10MB');
    return false;
  }
  return true;
};

const FieldIdCard: FC<FieldIdCardProps> = ({
  value, defaultValue = [], onChange, onUploadSuccess,
}) => {
  const [valuePair, setValuePair] = useMergedState(() => { return defaultValue; }, {
    value,
    onChange,
  });

  return (
    <Space className="field-id-card">
      <FieldUploadFile
        value={[valuePair[0]]}
        onChange={(newValue) => {
          [valuePair[0]] = newValue;
          setValuePair([...valuePair]);
        }}
        beforeUpload={async (file) => {
          const result = await fileValidator(file);

          if (!result) {
            return Upload.LIST_IGNORE;
          }
        }}
        onUploadSuccess={(res) => {
          onUploadSuccess(res, 0);
        }}
        autoHidden
        maxCount={1}
        listType="picture-card"
        accept="image/*"
      >
        <img src={IdCardSketch1} alt="人像面" />
        <span className="id-card-tips">人像面</span>
      </FieldUploadFile>

      <FieldUploadFile
        value={[valuePair[1]]}
        onChange={(newValue) => {
          [valuePair[1]] = newValue;
          setValuePair([...valuePair]);
        }}
        beforeUpload={async (file) => {
          const result = await fileValidator(file);

          if (!result) {
            return Upload.LIST_IGNORE;
          }
        }}
        onUploadSuccess={(res) => {
          onUploadSuccess(res, 1);
        }}
        autoHidden
        maxCount={1}
        listType="picture-card"
        accept="image/*"
      >
        <img src={IdCardSketch2} alt="国徽面" />
        <span className="id-card-tips">国徽面</span>
      </FieldUploadFile>
    </Space>
  );
};

export default FieldIdCard;
