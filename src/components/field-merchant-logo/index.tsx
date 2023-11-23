/**
 * 商家Logo表单字段组件 带审核功能
 *
 * @todo
 * icon
 *
 * sobird<i@sobird.me> at 2023/10/25 2:31:48 created.
 */

import { FC } from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { message, Upload, Space } from 'antd';
import type { RcFile } from 'antd/es/upload';
import { PlusOutlined } from '@ant-design/icons';
import Tooltip from '@/components/tooltip';
import FieldUploadFile from '@/components/field-upload-file';
import { MerchantLogoAuditStatusEnum } from '@/services/merchant';
import { fileToBase64 } from '@/utils';

import './index.scss';

type ValuePair = [string, string?];

interface FieldMerchantLogoProps {
  value?: ValuePair;
  defaultValue?: ValuePair;
  onChange?: (params: ValuePair) => void;
  status: 4 | 5 | 6;
}

const uploadButton = (
  <div>
    <PlusOutlined />
    <div style={{ marginTop: 8 }}>上传</div>
  </div>
);

const reviewTips = '您已申请修改店铺标志，当前处于审核中，审核通过前，会向消费者展示原来的店铺标志，感谢您的耐心等待';
const normalTips = '新上传的店铺标志通过审核后，会替换掉原有的店铺标志，点击右上角的保存后上传';

const fileValidator = async (file: RcFile) => {
  if (!file) {
    return;
  }
  if (file.size > 10000000) {
    message.error('照片大小不能超过10MB');
    return false;
  }
  try {
    const base64 = await fileToBase64(file);
    return await new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        if (width !== height) {
          message.error('请上传正方形的店铺标志图片');
          resolve(false);
        }
        if (width < 200) {
          message.error('店铺标志图片需要大于100*100像素');
          resolve(false);
        }
        resolve(true);
      };
    });
  } catch (e) {
    message.error(e.msg || e.message);
  }
};

const FieldMerchantLogo: FC<FieldMerchantLogoProps> = ({
  value, defaultValue = [], onChange, status,
}) => {
  const [valuePair, setValuePair] = useMergedState(() => { return defaultValue; }, {
    value,
    onChange,
  });

  // const tips = status === MerchantLogoAuditStatusEnum.审核中 ? reviewTips : normalTips;

  return (
    <div className="field-merchant-logo">
      <Space>
        <FieldUploadFile
          className="upload-logo-current"
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
          // 已上传则不允许此处再次编辑
          disabled={valuePair.length >= 1 && status === MerchantLogoAuditStatusEnum.审核通过}
          autoHidden
          maxCount={1}
          listType="picture-card"
          accept="image/*,.pdf,.bpm"
        >
          {uploadButton}
        </FieldUploadFile>

        {valuePair.length >= 1 && status && (
          <>
            <span className="updated-label">修改为 》</span>
            <FieldUploadFile
              className="upload-logo-updated"
              value={[valuePair[1]]}
              onChange={(newValue) => {
                [valuePair[1]] = newValue;
                setValuePair(valuePair);
              }}
              itemRender={originNode => {
                const { props } = originNode;
                return (
                  <Tooltip title={reviewTips}>
                    {/* eslint-disable-next-line react/prop-types */}
                    <div className={props.className}>
                      {props.children}
                      <span className={`merchant-logo-status merchant-logo-status-${status}`}>
                        {MerchantLogoAuditStatusEnum[status]}
                      </span>
                    </div>
                  </Tooltip>
                );
              }}
              autoHidden
              maxCount={1}
              listType="picture-card"
              accept="image/*,.pdf,.bpm"
            >
              <Tooltip title={normalTips}>{uploadButton}</Tooltip>
            </FieldUploadFile>
          </>
        )}

        <div className="description">
          1.店铺标志会在店铺页，订单页等地方，展示给消费者；
          <br />
          2.请上传正方形图片，不小于100*100像素；
          <br />
          3.格式支持：JPG/JPEG/PNG/GIF/BPM；
        </div>
      </Space>
    </div>
  );
};
export default FieldMerchantLogo;
