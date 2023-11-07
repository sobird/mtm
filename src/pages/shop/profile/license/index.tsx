/**
 * 店铺信息 - 经营许可
 *
 * sobird<i@sobird.me> at 2023/11/07 9:27:48 created.
 */

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Table, Tooltip } from 'antd';
import { Card } from '@mtm/shared';
import MerchantService, { MerchantLogoAuditStatusEnum } from '@/services/merchant';

import LicenseInfo from './sample';

const ShopProfileLicense = () => {
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState([]);

  useEffect(() => {
    MerchantService.licenses().then(res => {
      setLicenses(res);
    })
  }, []);

  return (
    <>
      <Card
        headStyle={{borderBottom: 0}}
        bodyStyle={{ paddingTop: 16 }}
        extra={<Button onClick={() => navigate('/shop/profile/license/operate?type=add')}>添加证照</Button>}
      >
        <Table
          bordered
          rowKey='id'
          // columns={columns}
          dataSource={licenses}
        >
          <Table.Column title='证照类型' dataIndex='type' />
          <Table.Column
            title='许可证照'
            dataIndex='src'
            render={(text: any, record) => <Button type='text'>证照预览</Button>}
          />
          <Table.Column
            title='证照有效截止日期'
            dataIndex='expireDate'
            render={(text: any, record) => (
              <>
                {text ? (
                  text
                ) : '--'}
                {record?.isExpired === true ? '已过期' : ''}
              </>
            )}
          />
          <Table.Column title='提交日期' dataIndex='createTime' />
          <Table.Column title='审核状态' dataIndex='auditStatus' />
          <Table.Column title='操作' dataIndex='auditStatus' render={(auditStatus, record) => (
            <>
              {auditStatus === 4 ? (
                <Tooltip title='审核中，暂时不支持删除'>
                  删除
                </Tooltip>
              ) : (
                ''
              )}
              
              {auditStatus === 5 ? (
                <>
                  <Button
                    type='text'
                  >
                  修改
                  </Button>
                  <Button type='text'>
                  删除
                  </Button>
                </>
              ) : (
                null
              )}

              {auditStatus === 6 && record.isExpired === false ? (
                <Tooltip title='当前许可证件正在使用中，暂时不支持删除'>
                  删除
                </Tooltip>
              ) : (
                ''
              )}

              {auditStatus === 6 && record.isExpired === true ? (
                <Button type='text'>
                删除
                </Button>
              ) : (
                ''
              )}
            </>
          )}/>
        </Table>
      </Card>

      {/* todo 待删除 */}
      <LicenseInfo />
    </>
  );
};

export default ShopProfileLicense;
