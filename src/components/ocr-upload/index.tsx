/**
 * upload-ocr
 * 
 * sobird<i@sobird.me> at 2023/08/15 0:41:33 created.
 */

import React, { PropsWithChildren, useState } from 'react';
import { Upload } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import VenusServices from '@/services/common/venus';
import OcrService from '@/services/common/ocr';

interface UploadOcrProps {
  type?: 1 | 2 | 3;
  value?: string;
  onChange?: (value: string) => void;
  onUploadSuccess?: (value: any) => void;
}

const uploadButton = (
  <div>
    <PlusOutlined style={{fontSize: '30px'}} />
    <div>点击上传</div>
  </div>
);

const OcrUpload: React.FC<PropsWithChildren<UploadOcrProps>> = ({ value, onChange, onUploadSuccess, type = 0, children, ...props}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const onUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
    console.log('1122', newFileList)
  };

  console.log('value', value)

  return (
    <Upload 
      listType="picture-card" 
      fileList={fileList}
      onChange={onUploadChange}
      customRequest={({ file, onProgress, onSuccess, onError}) => {
        VenusServices.upload(file as File, (percent) => {
          onProgress({ percent });
        }).then(res => {
          onSuccess(res);

          const { url } = res;
          onChange(url);
          console.log('url', url)
          
          // 图片文字识别
          OcrService.get({
            type,
            url: url,
          }).then(res => {
            onUploadSuccess?.(res[type]);
          })
        }).catch(onError)
      }}
      {...props}>
      {fileList?.length > 0 ? null : children || uploadButton}
    </Upload>
  )
}

export default OcrUpload;
