/*
 * index.tsx
 *
 * sobird<i@sobird.me> at 2023/06/22 22:41:07 created.
 */

import { useNavigate } from 'react-router-dom';
import {
  Form, Input, Button, Alert,
} from 'antd';
import { RightOutlined } from '@ant-design/icons';
import Entry from '@/layout/entry';

import Invitation, { IInvitationRequestData } from '@/services/common/invitation';

import './index.scss';

function EntryHome() {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const onFinish = (values: IInvitationRequestData) => {
    Invitation.post(values).then(() => {
      navigate('/settleinjx/shop');
    });
  };

  return (
    <Entry>
      <div className="entry-home">
        <div className="entry-home-banner" />
        <div className="entry-home-steps">
          <div className="step-item step-item-1">
            <h3>
              <span>01.</span>
              准备入驻资料
            </h3>
            <div className="desc">
              <span>准备店铺信息</span>
              <span>准备经营资质</span>
              <span>开店铺人证件</span>
            </div>
          </div>

          <div className="step-item step-item-2">
            <h3>
              <span>02.</span>
              选择店铺类型
            </h3>
            <div className="desc">
              <span>店铺类型了解</span>
              <span>明确资质要求</span>
              <span>确认店铺类型</span>
            </div>
          </div>

          <div className="step-item step-item-3">
            <h3>
              <span>03.</span>
              填写入驻申请
            </h3>
            <div className="desc">
              <span>主体信息</span>
              <span>资质证件</span>
              <span>经营信息</span>
            </div>
          </div>

          <div className="step-item step-item-4">
            <h3>
              <span>04.</span>
              提交等待审核
            </h3>
            <div className="desc">
              <span>招商初审</span>
              <span>证件复审</span>
              <span>账户开户</span>
            </div>
          </div>

          <div className="step-item step-item-5">
            <h3>
              <span>04.</span>
              开店线上经营
            </h3>
            <div className="desc">
              <span>发布商品信息</span>
              <span>设置提现账户</span>
              <span>线上售卖经营</span>
            </div>
          </div>
        </div>
        <div className="entry-home-form">
          <Form
            form={form}
            onFinish={onFinish}
            style={{ maxWidth: 600 }}
          >
            <Form.Item name="code" label="邀请码">
              <Input placeholder="邀请码非必填，如有请填写服务商招商码或推荐商家邀请码" />
            </Form.Item>
            <Form.Item className="entry-btn-item">
              <Button type="primary" htmlType="submit">
                立即入住
                <RightOutlined style={{ fontSize: '14px' }} />
              </Button>
            </Form.Item>
          </Form>
        </div>

        <div className="entry-home-reminder">
          <Alert
            message="友情提示：拟入驻美团电商的商家您好，入驻时无需支付给任何招商服务商和第三方费用，请您知悉！"
            description="目前平台仅开放数码家电/办公、宠物生活、母婴玩具、服饰鞋包、运动户外、汽配摩托、医药健康类目的商家自入驻，其余类目邀约制入驻请勿提交申请。入驻审核时效预计在7个工作日内，感谢支持。"
            type="warning"
            showIcon
          />
        </div>
      </div>
    </Entry>
  );
}

export default EntryHome;
