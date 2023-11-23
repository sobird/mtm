import { Form } from 'antd';

const formItemLayout = {
  labelCol: {
    flex: '0 0 110px',
  },
};

const SettingProfile = () => {
  return (
    <Form colon={false} {...formItemLayout}>
      <Form.Item label="店铺ID">405433786</Form.Item>
      <Form.Item label="账号名">pdd40543378658</Form.Item>
      <Form.Item label="登录密码">1212</Form.Item>
      <Form.Item label="绑定手机">153****1599</Form.Item>
      <Form.Item label="手机验证">关闭</Form.Item>
      <Form.Item label="最近登录">查看</Form.Item>
    </Form>
  );
};

export default SettingProfile;
