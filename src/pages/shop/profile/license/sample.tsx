import React, { Component } from 'react';
import { Button, Divider, Table, Modal, message, Tooltip } from 'antd';
import MerchantService, { MerchantLogoAuditStatusEnum } from '@/services/merchant';

import './index.scss';

interface IProps {
  merchantDetail?: any;
  permission?: any;
  merchantId?: string;
  shopInfo?: object;
}

const blankText = '暂未填写';

interface IState {
  visible?: boolean; // 是否显示删除资质列表
  licenseId?: number; // 资质许可证开发
  pageNo?: number; // 分页的页码
  pageSize?: number; // 每页的数据
  count: number;
  start?: number; // 分页开始
  priviewUrl?: null; // 当前预览的许可证的url
  imageViewVisible?: boolean; // 是否显示图片列表
  auditState?: number; //审核类型
  record: Object;
}

class LicenseInfo extends Component<IProps, IState> {
  constructor(props: any) {
    super(props);
    this.state = {
      visible: false, // 确认删除对话框是否展示
      licenseId: null, // 记录当前可能要删除许可证的id
      pageNo: 1, // 分页的页码
      pageSize: 10, // 每页的数据
      // start: 0, // 分页开始
      priviewUrl: null, // 当前预览的许可证的url
      imageViewVisible: false, // 当前预览的图片的url
      record: undefined,
    };
  }

  public componentDidMount() {
    // 获取经营许可列表
    MerchantService.licenses();
  }

  public render() {
    const { licenseList = {} } = this.props.merchantDetail || {};
    const licenseListShow = licenseList.pageinfo ? licenseList.pageinfo : [];
    const { count } = licenseList;
    const { record } = this.state;

    const columns: any = [
      {
        dataIndex: 'licenseTypeStr',
        title: '证照类型',
        render: (text: string | number, record) =>
          record?.currentObj?.licenseTypeStr ? (
            <span>{record?.currentObj?.licenseTypeStr || '--'}</span>
          ) : (
            <span style={{ color: '#BABCCC' }}>{blankText}</span>
          ),
      },
      {
        dataIndex: 'license',
        title: '许可证照',
        render: (text: any, record) => (
          <Button
            type='text'
            onClick={() => this.goToCheck(record?.currentObj?.licenseId)}
            style={{ marginLeft: '-15px' }}
          >
            证照预览
          </Button>
        ),
      },
      {
        dataIndex: 'validDeadline',
        title: '证照有效截止日期',
        render: (text: any, record) => (
          <span>
            {record?.currentObj?.validDeadline ? (
              <span>{record?.currentObj?.validDeadline}</span>
            ) : (
              <span style={{ color: '#BABCCC' }}>{blankText}</span>
            )}
            {record?.isOverdue === true ? <span className='overDue'>已过期</span> : ''}
          </span>
        ),
      },
      {
        dataIndex: 'createTime',
        title: '提交日期',
        render: (text: any, record) => (
          <span>
            {record?.currentObj?.createTime ? (
              <span>{record?.currentObj?.createTime}</span>
            ) : (
              <span style={{ color: '#BABCCC' }}>{blankText}</span>
            )}
          </span>
        ),
      },
      {
        dataIndex: 'auditState',
        title: '审核状态',
        render: (text: any, record) => (
          <>
            {(record.auditState === 4 && <span className='checking'>审核中</span>) || null}
            {(record.auditState === 5 && <span className='checkReject'>审核驳回</span>) || null}
            {(record.auditState === 6 && <span className='checked'>审核通过</span>) || null}
          </>
        ),
      },
      {
        dataIndex: 'action',
        title: '操作',
        render: (text: any, record) => (
          <span>
            {/* 审核中 */}
            {record && record.auditState === 4 ? (
              <Tooltip className='license-tool-tip' content='审核中，暂时不支持删除'>
                <span className='deleteChecking'>删除</span>
              </Tooltip>
            ) : (
              ''
            )}
            {/* 审核驳回 */}
            {record && record.auditState === 5 ? (
              <span>
                <Button
                  type='text'
                  onClick={() => this.updateLicense(record?.currentObj?.licenseId)}
                  style={{ marginLeft: '-15px' }}
                >
                  修改
                </Button>
                <Button type='text' onClick={() => this.showConfirmDelModal(record)} style={{ marginLeft: '-15px' }}>
                  删除
                </Button>
              </span>
            ) : (
              ''
            )}
            {/* 审核通过 */}
            {record && record.auditState === 6 && record.isOverdue === false ? (
              <Tooltip className='license-tool-tip' content='当前许可证件正在使用中，暂时不支持删除'>
                <span className='deleteChecking'>删除</span>
              </Tooltip>
            ) : (
              ''
            )}
            {record && record.auditState === 6 && record.isOverdue === true ? (
              <Button type='text' onClick={() => this.showConfirmDelModal(record)} style={{ marginLeft: '-15px' }}>
                删除
              </Button>
            ) : (
              ''
            )}
          </span>
        ),
      },
    ];
    return (
      <div className='license-info-container'>
        <div className='add-button-box'>
          <Button
            onClick={this.addNew}
          >
            添加证照
          </Button>
        </div>
        <Divider />
        <div className='table-box'>
          <Table
            bordered
            rowKey="id"
            columns={columns}
            dataSource={licenseListShow}
          />
        </div>
        {/* <PaginationBase
          getPageSizeChange={this.handlePageSizeChange}
          pageSize={this.state.pageSize}
          pageNum={this.state.pageNo}
          getPageNumChange={this.handlePageNumChange}
          total={count}
        /> */}
        {/* {
          licenseListShow && licenseList.length > 10 ? (
          ) : null
        } */}
        <Modal
          title='确定删除此许可证？'
          visible={this.state.visible}
          onCancel={this.closeConfirmDelModal}
          onConfirm={this.delLicense}
          className='confirmDeleteModal'
          backdropStyle={{ background: 'rgba(0, 0, 0, 0.5)' }}
          style={{ width: 400, height: 200, overflow: 'hidden' }}
          cancelText='取消'
          confirmText='删除'
          closable={false}
          backdropClosable={false}
        >
          <span style={{ lineHeight: '2', color: 'var(--text-color-secondary)' }}>
            是否确认删除{record?.currentObj?.licenseTypeStr}，删除后，该许可证将被移除
          </span>
        </Modal>
        {/* {this.state.imageViewVisible ? (
          <Viewer
            visible={this.state.imageViewVisible}
            onClose={() => this.closeImageViewVisible()}
            noNavbar
            noImgDetails
            scalable={false}
            zIndex={9990}
            images={[
              {
                src: `${this.state.priviewUrl}`,
                alt: '',
              },
            ]}
          />
        ) : null} */}
      </div>
    );
  }

  /**
   * @description: 预览查看图片页面
   * @param {*}
   * @return {*}
   */
  private goToCheck = async (id: number) => {
    try {
      const res = await merchantApi.preLicensePic({ licenseId: id }, true);
      const { code, msg, data } = res;
      if (code === 0) {
        this.setState({
          priviewUrl: data,
          imageViewVisible: true,
        });
      } else {
        message.open({
          content: msg || '预览资质许可失败',
          type: 'success',
          duration: 2000,
        });
      }
    } catch (e) {
      message.open({
        content: '预览资质许可异常',
        type: 'success',
        duration: 2000,
      });
    }
  };

  /**
   * @description: 确认显示删除对话框
   * @param {*}
   * @return {*}
   */
  private showConfirmDelModal = (record: Object) => {
    this.setState({
      visible: true,
      licenseId: record?.currentObj?.licenseId,
      record,
      auditState: record?.auditState,
      delType: record?.auditState === MerchantLogoAuditStatusEnum.审核驳回 ? 2 : 1,
    });
  };

  /**
   * @description: 许可证修改
   * @param {*}
   * @return {*}
   */
  private updateLicense = (licenseId: number) => {
    this.props.history.push(`/shop/profile/license/operate?type=update&licenseId=${licenseId}`);
  };

  /**
   * @description: 关闭删除对话框
   * @param {*}
   * @return {*}
   */
  private closeConfirmDelModal = () => {
    this.setState({
      visible: false,
      licenseId: null,
      record: undefined,
    });
  };

  /**
   * @description: 关闭删除图片预览
   * @param {*}
   * @return {*}
   */
  private closeImageViewVisible = () => {
    this.setState({
      imageViewVisible: false,
    });
  };

  /**
   * @description: 删除经营许可证
   * @param {*}
   * @return {*}
   */
  private delLicense = async () => {
    const { queryLicenseInfoList } = this.props;
    const { licenseId, delType, pageSize } = this.state;
    try {
      const res = await merchantApi.deleteLicense({ licenseId, delType }, true);
      const { code, msg } = res;
      if (code === 0) {
        message.open({
          content: '成功删除一条许可证',
          type: 'success',
          duration: 2000,
        });
        this.closeConfirmDelModal();
        // queryLicenseInfoList({ pageNo: 1, pageSize });
      } else {
        message.open({
          content: msg || '删除失败，稍后请重新操作',
          type: 'error',
        });
      }
    } catch (e) {
      message.open({
        content: e.message || e.msg || '删除异常，稍后请重新操作',
        type: 'error',
      });
    }
  };

  /**
   * @description: // 每页数量变化的时候
   * @param {*}
   * @return {*}
   */
  private handlePageSizeChange = (value: number) => {
    this.setState({
      pageSize: value,
      // start: 0,
      pageNo: 1,
    });
    this.props.queryLicenseInfoList({ pageNo: 1, pageSize: value });
  };

  /**
   * @description: 页码变化的时候
   * @param {*}
   * @return {*}
   */
  private handlePageNumChange = (value: number) => {
    const { pageSize } = this.state;
    this.setState({
      pageNo: value,
      // start: (value - 1) * pageSize,
    });
    this.props.queryLicenseInfoList({ pageNo: value, pageSize });
  };

  /**
   * @description: 添加新的商标
   * @param {*}
   * @return {*}
   */
  private addNew = () => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    this.props.history.push('/shop/profile/license/operate?type=add');
  };
}

const mapStateToProps = (state: any) => ({
  merchantDetail: state.merchantDetail,
  permission: state.navMenu.permission,
  shopInfo: state.merchantDetail.shopInfo,
});
export default LicenseInfo;
