/**
 * upload-ocr
 * 
 * sobird<i@sobird.me> at 2023/08/15 0:41:33 created.
 */

import React, { PropsWithChildren, useState } from 'react';
import { Upload } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';

interface UploadOcrProps {
  type?: 1 | 2 | 3;
}

const uploadButton = (
  <div>
    <PlusOutlined style={{fontSize: '30px'}} />
    <div>点击上传</div>
  </div>
);

const OcrUpload: React.FC<PropsWithChildren<UploadOcrProps>> = ({ type = 1, ...props}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  return (
    <Upload 
      listType="picture-card" 
      fileList={fileList}
      customRequest={(options) => {
        console.log('options', options)
      }}
      {...props}>
      {uploadButton}
    </Upload>
  )
}

export default OcrUpload;
