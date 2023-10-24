/**
 * Venus Upload File
 * 
 * sobird<i@sobird.me> at 2023/10/23 22:14:34 created.
 */

import React, { PropsWithChildren, ComponentProps } from 'react';
import { Upload } from 'antd';
import VenusService, { IVenusUploadResponse } from '@/services/common/venus';

export interface UploadFileProps extends ComponentProps<typeof Upload> {
  privatible?: boolean;
  onUploadSuccess?: (res: IVenusUploadResponse) => void;
}

const UploadFile: React.FC<PropsWithChildren<UploadFileProps>> = ({ privatible = false, onUploadSuccess, children, ...prop }) => {
  return (
    <Upload
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
      {...prop}
    >
      {children}
    </Upload>
  );
};

export default UploadFile;
