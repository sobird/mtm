/**
 * 店铺管理员
 *
 * @todo
 * 店铺管理员审核
 *
 * sobird<i@sobird.me> at 2023/10/26 15:17:34 created.
 */

import { useNavigate } from 'react-router-dom';
import {
  Alert, Button, Space,
} from 'antd';
import { Page } from '@mtm/shared';
import RejectionReason from '@/components/reason';
import AdminForm from './components/admin-form';

import './index.scss';

const BreadcrumbItem = [
  {
    title: '首页',
    path: '/',
  },
  {
    title: '店铺',
    path: 'shop',
  },
  {
    title: '店铺信息',
    path: 'admin',
  },
];

function ShopAdmin() {
  const navigate = useNavigate();

  return (
    <Page
      className="shop-base-admin"
      title="店铺管理员"
      breadcrumb={{
        items: BreadcrumbItem,
      }}
    >
      <RejectionReason list={['不通过', '用户名填写错误哦']} type="error" />

      <Alert
        message={(
          <div className="admin-alert">
            您已申请修改管理员信息，当前处于审核中，审核期间不可以再次修改信息，感谢您的耐心等待。
            <Button
              type="link"
              onClick={() => {
                navigate('/shop/admin');
              }}
            >
              查看申请信息
            </Button>
          </div>
        )}
        type="warning"
        showIcon
      />

      {/* 删除驳回申请 */}
      <Alert
        message={(
          <div className="admin-alert">
            <span>审核驳回。您申请修改的管理员信息审核不通过，请针对驳回原因进行修改后再次提交</span>
            <Button
              type="link"
              onClick={() => {
                navigate('/shop/admin');
              }}
            >
              去修改
            </Button>
          </div>
        )}
        type="error"
        closable
        showIcon
        onClose={() => { return false; }}
        // extra={(
        //   <Button
        //     icon="close" type="text" status="normal"
        //     onClick={() => {
        //       setAlertCloseVisible(true);
        //       Modal.confirm({
        //         title: '确定删除被驳回的管理员变更申请吗？',
        //         style: { width: 400, height: 200, overflow: 'hidden' },
        //         confirmText: '删除',
        //         onConfirm: async () => {
        //           mc('b_group_mall_b_hbkebu72_mc');
        //           try {
        //             await merchantApi.deleteAuditManagerInfo(null, false);
        //             isBaseTab ? queryManagerInfo() : auditManagerInfo();
        //             setAlertCloseVisible(false);
        //           } catch (e) {
        //             Message.error(e.msg || e.message || '删除被驳回的管理员信息异常');
        //           }
        //         },
        //         onCancel: () => { },
        //       });
        //     }}
        //   />
        // )}
      />

      <AdminForm>
        <Space style={{ marginLeft: 142 }}>
          <Button type="primary" htmlType="submit">
            更新店铺管理员信息
          </Button>
        </Space>
      </AdminForm>
    </Page>
  );
}

export default ShopAdmin;
