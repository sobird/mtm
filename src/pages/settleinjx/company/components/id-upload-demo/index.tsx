/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/07/12 11:20:46 created.
 */

import React, { PropsWithChildren, useState } from 'react';
import { Button, Modal, Space, Image } from 'antd';
import idDemo1 from './img/id_demo_1.png';
import idDemo2 from './img/id_demo_2.png';
import idDemo3 from './img/id_demo_3.png';
import idDemo4 from './img/id_demo_4.png';

// import './index.scss';


const IdUploadDemo: React.FC<PropsWithChildren> = ({ children }) => {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <Button 
        type="link" 
        style={{fontSize: '12px', padding: 0}} 
        onClick={() => setOpen(true)}>{children}</Button>
      <Modal
        title="身份证件上传示例"
        centered
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        width="auto"
        okText="我知道了"
      >
        <p>1. 身份证件正反面复印件，加盖开店公司印章：</p>
        <Space style={{marginBottom: '20px'}}>
          <Image src={idDemo1} width={250} preview={false}/>
          <Image src={idDemo2} width={250} preview={false}/>
        </Space>
        <p>2. 手持身份证件的正反面照片：</p>
        <Space style={{marginBottom: '10px'}}>
          <Image src={idDemo3} width={250} preview={false}/>
          <Image src={idDemo4} width={250} preview={false}/>
        </Space>
        <p><span style={{color: 'red'}}>*</span>注：身份信息请勿打马赛克，请保持所有字迹清晰可见</p>
      </Modal>
    </>
  );
};

export default IdUploadDemo;
