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

interface UploadOcrProps {
  type?: 1 | 2 | 3;
}

const uploadButton = (
  <div>
    <PlusOutlined style={{fontSize: '30px'}} />
    <div>点击上传</div>
  </div>
);

const OcrUpload: React.FC<PropsWithChildren<UploadOcrProps>> = ({ type = 1, children, ...props}) => {
  const [fileList, setFileList] = useState<UploadFile[]>([
    {
      uid: '-1',
      name: 'image.png',
      status: 'done',
      url: 'https://zos.alipayobjects.com/rmsportal/jkjgkEfvpUPVyRjUImniVslZfWPnJuuZ.png',
    },
  ]);

  const onChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  return (
    <Upload 
      listType="picture-card" 
      fileList={fileList}
      onChange={onChange}
      customRequest={(options) => {
        console.log('options', options)

        VenusServices.upload(options.file);
      }}
      {...props}>
      {fileList?.length > 0 ? null : children || uploadButton}
    </Upload>
  )
}

export default OcrUpload;
