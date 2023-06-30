/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/22 22:41:07 created.
 */

import { useEffect, useState } from 'react';
import { Form, Card, Button, Alert, Radio, Cascader, Modal } from 'antd';
import Entry from "@/components/layout/entry";
import category from '@/services/merchant/category';
import Task, { IEntryTask } from '@/services/merchant/entry/task';
import Type, { IEntryType } from '@/services/merchant/entry/type';

import './index.scss';

interface IShopForm {
  category: string[];
  type: number;
}

function EntryShop() {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [type, setType] = useState<IEntryType[]>([]);
  const [task, setTask] = useState<IEntryTask>();
  const [form] = Form.useForm();

  useEffect(() => {
    category().then(res => {
      setCategoryOptions(res);
    });

    Task.get().then(res => {
      setTask(res);
    });

    // 获取店铺类型
    Type.get().then(res => {
      setType(res);
    });
  }, []);

  // 表单提交
  const onFinish = (values: IShopForm) => {
    console.log(values);
  };

  const options = type.map(item => {
    return {
      value: item.poiType,
      label: (<><span className='title'>企业{item.poiTypeName}</span><span className='desc'>{item.poiTypeDesc}</span></>)
    }
  })

  return (
    <Entry>
      <div className="entry-shop">
        <div className="entry-shop-tips">
          <Alert message="目前平台仅开放数码家电/办公、宠物生活、母婴玩具、服饰鞋包、运动户外、汽配摩托、医药健康类目的商家自入驻，其余类目邀约制入驻请勿提交申请。入驻审核时效预计在7个工作日内，感谢支持。" type="info" showIcon />
        </div>
        
        <div className="entry-shop-main">
          <h2>请选择您的店铺类型及主营类目</h2>

          <Card>
            <Form
              form={form}
              onFinish={onFinish}
              layout="vertical"
            >
              <Form.Item name="category" label="主营类目">
                <Cascader options={categoryOptions} fieldNames={{label: 'name', value: 'id'}} placeholder="主营类目决定您店铺的经营范围，请谨慎选择" style={{width: 430}} />
              </Form.Item>
              <Form.Item name="shoptype" label={(<>店铺类型<Button type='link' className="how-select">该如何选择？</Button></>)}>
                <Radio.Group 
                  onChange={(event) => {
                    const { value } = event.target;
                    const poi = type.find(item => item.poiType == value);
                    
                    Modal.warning({
                      title: `确定更改店铺类型为 ${poi.poiTypeName} ？`,
                      content: '温馨提示：如果更换店铺类型，店铺名称会被清空，需重新上传',
                      okText: '确定',
                    });
                  }} 
                  options={options} 
                  className='shop-type-radio'/>
              </Form.Item>
            </Form>
          </Card>
        </div>

        <div className="entry-shop-footer">
          <Button type="primary" onClick={() => {
            form.submit();
          }}>下一步</Button>
        </div>
      </div>

      <Modal
        title="Modal 1000px width"
        centered
        open={false}
        width={1000}
      >
        <p>some contents...</p>
        <p>some contents...</p>
        <p>some contents...</p>
      </Modal>
    </Entry>
  )
}

export default EntryShop;
