/*
 * index.tsx
 * 
 * sobird<i@sobird.me> at 2023/06/22 22:41:07 created.
 */

import { useEffect, useState } from 'react';
import { Form, Card, Button, Alert, Radio, Cascader, Modal } from 'antd';
import Entry from "@/components/layout/entry";
import category from '@/services/merchant/category';

import './index.scss';

interface IShopForm {
  category: string[];
  type: number;
}

function EntryShop() {
  const [categoryOptions, setCategoryOptions] = useState([]);
  const [form] = Form.useForm();

  useEffect(() => {
    category().then(res => {
      setCategoryOptions(res);
    })
  }, []);

  const shoptype = form.getFieldValue('shoptype');


  const onFinish = (values: IShopForm) => {
    console.log(values);
  };

  const options = [
    { value: '23', label: (<><span className='title'>企业旗舰店</span><span className='desc'>适合自有品牌的企业或拥有独占授权品牌的企业申请</span></>) },
    { value: '22', label: (<><span className='title'>企业专卖店</span><span className='desc'>适合拥有1个授权品牌且授权链路小于2级的企业申请</span></>) },
    { value: '21', label: (<><span className='title'>企业专营店</span><span className='desc'>适合拥有2个及更多自有品牌或授权品牌的企业申请</span></>) },
    { value: '20', label: (<><span className='title'>企业工厂店</span><span className='desc'>适合生产线企业申请</span></>) },
  ];

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
                    console.log('event', event)
                    Modal.warning({
                      title: '确定更改店铺类型为“专卖店”？',
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
