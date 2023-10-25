/**
 * Venus Upload File
 * 
 * sobird<i@sobird.me> at 2023/10/23 22:14:34 created.
 */

import React, { useState, PropsWithChildren, ComponentProps } from 'react';
import { Upload, Modal } from 'antd';
import type { RcFile } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import VenusService, { IVenusUploadResponse } from '@/services/common/venus';
import { fileToBase64 } from '@/utils';

export interface UploadFileProps extends ComponentProps<typeof Upload> {
  privatible?: boolean;
  onUploadSuccess?: (res: IVenusUploadResponse) => void;
  /** 文件数量超过 maxCount 自动隐藏上传按钮 */
  autoHidden?: boolean;
}

const UploadFile: React.FC<PropsWithChildren<UploadFileProps>> = ({ fileList, maxCount, privatible = false, onUploadSuccess, autoHidden, children, ...props }) => {
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
      alt: file.name || file.url?.substring(file.url?.lastIndexOf('/') + 1)
    });
    setPreviewOpen(true);
  };

  return (
    <>
      <Upload
        fileList={fileList}
        customRequest={({ file, action, onSuccess, onProgress, onError, ...options }) => {
          const config: {[key in string]: unknown} = {...options}
          if(action) {
            config.url = action;
          }
          VenusService.upload(file as File, {
            type: privatible ? 1 : 2,
            onProgressPercent(percent) {
              onProgress({ percent });
            },
            ...config
          }).then(res => {
            onSuccess(res);
            onUploadSuccess?.(res);
          }).catch(onError);
        }}
        onPreview={onPreview}
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

export default UploadFile;
