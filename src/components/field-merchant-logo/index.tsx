/**
 * 商家Logo表单字段组件 带审核功能
 *
 * @todo
 * icon
 *
 * sobird<i@sobird.me> at 2023/10/25 2:31:48 created.
 */

import React, { useState, FC, ComponentProps } from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { Button, Alert, Space } from 'antd';
import type { UploadFile as AntdUploadFile } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import Tooltip from '@/components/tooltip';
import UploadFile from '@/components/upload-file';
import { MerchantLogoAuditStatusEnum } from '@/services/merchant';

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

const FieldMerchantLogo: FC<FieldMerchantLogoProps> = ({ value, defaultValue = [], onChange, status }) => {
  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value,
    onChange,
  });

  const [currentUrl, updatedUrl] = valuePair;
  const [currentFileList, setCurrentFileList] = useState<AntdUploadFile[]>(
    currentUrl ? [{ url: currentUrl, status: 'done', uid: currentUrl, name: currentUrl }] : []
  );
  const [updatedFileList, setUpdatedFileList] = useState<AntdUploadFile[]>(
    updatedUrl ? [{ url: updatedUrl, status: 'done', uid: updatedUrl, name: updatedUrl }] : []
  );

  const disabled = false;

  const tips = status === MerchantLogoAuditStatusEnum.审核中 ? reviewTips : normalTips;

  return (
    <div className='field-merchant-logo'>
      <Space>
        <UploadFile
          className='upload-logo-current'
          fileList={currentFileList}
          onChange={({ fileList }) => {
            setCurrentFileList(fileList);
          }}
          onUploadSuccess={({ url }) => {
            valuePair[0] = url;
            setValuePair(valuePair);
          }}
          // 已上传则不允许此处再次编辑
          disabled={currentFileList.length >= 1}
          autoHidden
          maxCount={1}
          listType='picture-card'
          accept='image/*,.pdf,.bpm'
        >
          {uploadButton}
        </UploadFile>

        {currentFileList.length >= 1 && status && (
          <>
            <span className='updated-label'>修改为 》</span>
            <UploadFile
              className='upload-logo-updated'
              fileList={updatedFileList}
              onChange={({ fileList }) => {
                setUpdatedFileList(fileList);
              }}
              onRemove={() => {
                valuePair[1] = '';
                setValuePair(valuePair);
              }}
              onUploadSuccess={({ url }) => {
                valuePair[1] = url;
                setValuePair(valuePair);
              }}
              itemRender={originNode => {
                const { props } = originNode;
                return (
                  <Tooltip title={reviewTips}>
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
              listType='picture-card'
              accept='image/*,.pdf,.bpm'
            >
              <Tooltip title={normalTips}>{uploadButton}</Tooltip>
            </UploadFile>
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
