/**
 * upload-ocr
 *
 * sobird<i@sobird.me> at 2023/08/15 0:41:33 created.
 */

import React, { PropsWithChildren, useState } from 'react';
import { Modal, Upload } from 'antd';
import type { RcFile, UploadFile, UploadProps } from 'antd/es/upload/interface';
import { PlusOutlined } from '@ant-design/icons';
import VenusService from '@/services/common/venus';

interface UploadOcrProps {
  type?: 1 | 2 | 3;
  value?: string;
  onChange?: (value: string) => void;
  onUploadSuccess?: (value: any) => void;
}

const uploadButton = (
  <div>
    <PlusOutlined style={{ fontSize: '30px' }} />
    <div>点击上传</div>
  </div>
);

const getBase64 = (file: RcFile): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => { return resolve(reader.result as string); };
    reader.onerror = (error) => { return reject(error); };
  });
};

const OcrUpload: React.FC<PropsWithChildren<UploadOcrProps>> = ({
  value, onChange, onUploadSuccess, type = 0, children, ...props
}) => {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const initFileList = fileList.length === 0 && value ? [{
    url: value,
    uid: '-1',
    status: 'done',
  }] : fileList;

  const onUploadChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    console.log('newFileList', newFileList);
    setFileList(newFileList);
  };

  const handlePreview = async (fileVal: UploadFile) => {
    const file = fileVal;
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPreviewImage(file.url || (file.preview as string));
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1));
  };

  return (
    <>
      <Upload
        listType="picture-card"
        fileList={initFileList}
        onChange={onUploadChange}
        onPreview={handlePreview}
        onRemove={() => {
          onChange('');
        }}
        customRequest={({
          file, onProgress, onSuccess, onError,
        }) => {
          VenusService.upload(file as File, (percent) => {
            onProgress({ percent });
          }).then((res) => {
            onSuccess(res);

            const { url } = res;
            onChange(url);

            // 图片文字识别
            VenusService.ocr({
              type,
              url,
            }).then((ocrRes) => {
              onUploadSuccess?.(ocrRes);
            });
          }).catch(onError);
        }}
        {...props}
      >
        {initFileList?.length > 0 ? null : children || uploadButton}
      </Upload>
      <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => { return setPreviewOpen(false); }}>
        <img style={{ width: '100%' }} src={previewImage} alt="" />
      </Modal>
    </>
  );
};

export default OcrUpload;
