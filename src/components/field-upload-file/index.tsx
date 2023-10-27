/**
 * Venus Upload File
 *
 * @todo
 * 实现 FieldUploadFile 表单组件
 *
 * sobird<i@sobird.me> at 2023/10/23 22:14:34 created.
 */

import React, { useState, PropsWithChildren } from 'react';
import useMergedState from 'rc-util/lib/hooks/useMergedState';
import { Upload, Modal, UploadProps } from 'antd';
import type { RcFile, UploadFile } from 'antd/es/upload';
import VenusService, { IVenusUploadResponse } from '@/services/common/venus';
import { fileToBase64 } from '@/utils';

export interface FieldUploadFileProps extends Omit<UploadProps, 'onChange' | 'fileList'> {
  value?: string[];
  defaultValue?: string[];
  onChange?: (params: string[]) => void;

  onSelectChange?: UploadProps['onChange'];
  /** 私有上传 */
  privatible?: boolean;
  onUploadSuccess?: (res: IVenusUploadResponse) => void;
  /** 文件数量超过 maxCount 自动隐藏上传按钮 */
  autoHidden?: boolean;
}

const FieldUploadFile: React.FC<PropsWithChildren<FieldUploadFileProps>> = ({
  value,
  defaultValue = [],
  onChange,
  onSelectChange,
  maxCount,
  privatible = false,
  onUploadSuccess,
  autoHidden,
  children,
  ...props
}) => {
  const [valuePair, setValuePair] = useMergedState(() => defaultValue, {
    value,
    onChange,
  });

  const [fileList, setFileList] = useState<UploadFile[]>(
    valuePair?.filter(item => item).map(url => ({ url, status: 'done', uid: url, name: url }))
  );

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState({
    src: '',
    alt: '',
  });

  const onPreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await fileToBase64(file.originFileObj as RcFile);
    }

    setPreviewImage({
      src: file.url || (file.preview as string),
      alt: file.name || file.url?.substring(file.url?.lastIndexOf('/') + 1),
    });
    setPreviewOpen(true);
  };

  return (
    <>
      <Upload
        fileList={fileList}
        onChange={info => {
          setFileList(info.fileList);
          onSelectChange?.(info);
        }}
        onRemove={() => {
          valuePair.pop();
          setValuePair([...valuePair]);
        }}
        customRequest={({ file, action, onSuccess, onProgress, onError, ...options }) => {
          const config: { [key in string]: unknown } = { ...options };
          if (action) {
            config.url = action;
          }
          VenusService.upload(file as File, {
            type: privatible ? 1 : 2,
            onProgressPercent(percent) {
              onProgress({ percent });
            },
            ...config,
          })
            .then(res => {
              onSuccess(res);
              onUploadSuccess?.(res);

              setValuePair([...valuePair.filter(item => item), res.url]);
            })
            .catch(onError);
        }}
        onPreview={onPreview}
        maxCount={maxCount}
        {...props}
      >
        {maxCount && fileList?.length >= maxCount && autoHidden ? null : children}
      </Upload>
      <Modal open={previewOpen} title={previewImage.alt} footer={null} onCancel={() => setPreviewOpen(false)}>
        <img alt={previewImage.alt} style={{ width: '100%' }} src={previewImage.src} />
      </Modal>
    </>
  );
};

export default FieldUploadFile;
