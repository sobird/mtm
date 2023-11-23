/**
 * 商标创建和更新
 *
 * sobird<i@sobird.me> at 2023/11/07 14:43:46 created.
 */

import { Component } from 'react';
import {
  Breadcrumb, Form, Radio, message, Tooltip,
} from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  BrandTypeEnum,
  BrandTypeMap,
  TrademarkRegistrationTypeEnum,
} from '@/services/merchant';

import ButtonTab from './button-tab';
// import UploadImage from '@component/upload-image';
import RejectionReason from '@/components/reason';
import './index.scss';

const RadioGroup = Radio.Group;

interface IProps {
  merchantDetail?: any;
}

// 商标注册证明下面的说明组件
// const trademarkRegCertificatesText = () => {
//   return (
//     <div className="trademarkRegCertificatesText">
//       <span>1、请上传《商标注册证》或申请日起已满6个月的《注册申请受理通知书》</span>
//       <span>2、上传的《商标注册证》或《商标受理通知书》的申请人或注册人必须为开店公司</span>
//       <span>3、变更中的商标请同时上传《变更受理通知书》和《注册申请受理通知书》</span>
//       <span>4、转入/已转让的商标需上传《转让受理通知书》或者《转让证明》</span>
//       <span>5、《商标注册证》续证完成，而原《商标注册证》已经过期，需同时上传《核准续展注册证明》</span>
//     </div>
//   );
// };

class AddBrand extends Component<IProps> {
  constructor(props: any) {
    super(props);
    this.state = {
      brand: {
        trademarkId: null,
        brandId: null,
        brandType: BrandTypeEnum.授权商标, // OWN,AUTHORIZE
        brandAuthCertificates: [], // 品牌授权证明
        brandAuthExpiryDate: '', // 品牌授权有效期
        trademarkRegType: TrademarkRegistrationTypeEnum['自然人（商标注册人为个人）'], // 商标注册人类型
        ownerIdCertificates: ['', ''], // 商标持有人身份证
        trademarkRegCertificates: [], // 商标注册证明
        trademarkName: '', // 商标注册名
        trademarkCode: '', // 商标注册号
        trademarkRegExpiryDate: '',
      }, // 最后需要提交的商标信息
      rejectReason: '',
    };
    this.isAddTrade = true;
  }

  public componentDidMount() {
    const { location, merchantDetail = {} } = this.props;
    // 获取品牌资质列表接口
    const pathnameList = location?.pathname.split('/') || [];
    const isAddTrade = pathnameList[4] === 'add';
    this.isAddTrade = isAddTrade;
    if (!isAddTrade) {
      this.queryTrademark(pathnameList[5]);
      this.getRejectInfo(pathnameList[5]);
    }
  }

  /**
   * @description: 获取商标数据
   * @param {*}
   * @return {*}
   */
  public queryTrademark = async (trademarkId: string) => {
    try {
      const res = await merchantApi.queryTrademark({ trademarkId });
      const { code, msg, data = [] } = res;
      if (code === 0) {
        this.setState({
          brand: data,
        });
      } else {
        message.open({
          content: msg || '获取商标详情失败',
          type: 'error',
        });
      }
    } catch (e) {
      message.open({
        content: e.message || e.msg || '获取商标详情异常',
        status: 'error',
      });
    }
  };

  /**
   * @description: 获取当前商标详情
   * @param {*}
   * @return {*}
   */
  public getRejectInfo = async (trademarkId: string) => {
    try {
      const { code, msg, data } = await merchantApi.getRejectInfo({ dataType: '10030001', dataId: +trademarkId });
      if (code === 0) {
        this.setState({
          rejectReason: data.rejectReason, // 驳回原因
        });
      } else {
        message.open({
          content: msg || '获取许可证驳回数据失败',
          type: 'error',
          duration: 2000,
        });
      }
    } catch (e) {
      console.log(e);
    }
  };

  /**
   * @description: 返回跳转到商标列表页
   * @param {*}
   * @return {*}
   */
  public goBack = () => {
    this.props.updateInfo({ activityTab: 'brand-info' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    this.props.history.push('/shop/profile');
  };

  /**
   * @description: 商标注册证明校验
   * @param {*}
   * @return {*}
   */
  public trademarkRegCertificatesValidator = (rule: any, value: any, callback: any) => {
    if (!value || (value && value.length === 0)) {
      callback('请上传商标注册证明');
      return;
    }
    if (value && value.length > 10) {
      callback('商标注册证明最多上传10张');
      return;
    }
    const errorList = value && value.filter((item: any) => { return typeof item !== 'string'; });
    if (errorList.length > 0) {
      callback('存在上传错误的图片');
      return;
    }
    callback();
  };

  /**
   * @description: 品牌授权证明校验
   * @param {*}
   * @return {*}
   */
  public brandAuthCertificatesValidator = (rule: any, value: any, callback: any) => {
    if (!value || (value && value.length === 0)) {
      callback('请上传品牌授权证明');
      return;
    }
    if (value && value.length > 10) {
      callback('品牌授权证明最多上传10张');
      return;
    }
    const errorList = value && value.filter((item: any) => { return typeof item !== 'string'; });
    if (errorList.length > 0) {
      callback('存在上传错误的图片');
      return;
    }
    callback();
  };

  /**
   * @description: 商标持有人身份证校验
   * @param {*}
   * @return {*}
   */
  public ownerIdCertificatesValidator = (rule: any, value: any, callback: any) => {
    if (!value || (!value[0] && !value[1])) {
      callback('请上传商标持有人身份证');
      return;
    }
    if (!value[0]) {
      callback('请上传人像面');
      return;
    }
    if (!value[1]) {
      callback('请上传国徽面');
      return;
    }
    callback();
  };

  /**
   * @description: 提交数据
   * @param {*}
   * @return {*}
   */
  public submit = async (value: any) => {
    const { saveBrand, updateTrademark } = this.props;
    const params = {
      brandType: +value.brandType,
      trademarkCode: value.trademarkCode,
      trademarkRegType: +value.brandType === BrandTypeEnum.授权商标 ? value.trademarkRegType : null,
      trademarkName: value.trademarkName,
      brandAuthCertificates: +value.brandType === BrandTypeEnum.授权商标 ? value.brandAuthCertificates || [] : [],
      brandAuthExpiryDate: +value.brandType === BrandTypeEnum.授权商标 ? value.brandAuthExpiryDate || '' : '',
      trademarkRegCertificates: value.trademarkRegCertificates || [],
      trademarkRegExpiryDate: value.trademarkRegExpiryDate,
      ownerIdCertificates:
        value.ownerIdCertificates && value.ownerIdCertificates.every(url => { return url; }) ? value.ownerIdCertificates : [],
    };
    const { trademarkId, brandId } = this.state.brand;
    const res = this.isAddTrade
      ? await saveBrand(params)
      : await updateTrademark({
        ...params,
        trademarkId,
        brandId,
      });
    if (res.code === 0) {
      message.open({
        content: `${this.isAddTrade ? '创建' : '更新'}商标成功`,
        type: 'success',
        duration: 2000,
        onClose: () => {
          this.goBack();
        },
      });
    }
  };

  /**
   * @description: // 取消提交
   * @param {*}
   * @return {*}
   */

  public cancle = () => {
    this.goBack();
  };

  /**
   * @description: 商标注册证明有效期
   * @param {*}
   * @return {*}
   */
  public trademarkRegExpiryDateValidator = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback('请选择商标注册证明有效期');
      return;
    }
    if (dayjs(value).isBefore(dayjs(), 'day')) {
      callback('选择时间不能早于当前时间');
      return;
    }
    callback();
  };

  /**
   * @description: 品牌注册证明有效期
   * @param {*}
   * @return {*}
   */
  public brandAuthExpiryDateValidator = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback('请选择品牌注册证明有效期');
      return;
    }
    if (dayjs(value).isBefore(dayjs(), 'day')) {
      callback('选择时间不能早于当前时间');
      return;
    }
    callback();
  };

  /**
   * @description:时间选择器可以选择的范围
   * @param {*}
   * @return {*}
   */
  public disabledCondition = (cur: dayjs.Dayjs) => { return cur.isBefore(dayjs(), 'day') || cur.isSame(dayjs(), 'day'); };

  /**
   * @description: 商标注册号校验
   * @param {*}
   * @return {*}
   */
  public trademarkCodeValidator = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback('请输入商标注册号');
      return;
    }
    if (value && value.length > 50) {
      callback('商标注册号长度不超过50个字符');
      return;
    }
    const specialTypeReg = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    const hanReg = /[\u4e00-\u9fa5]/;
    if (value && specialTypeReg.test(value)) {
      callback('商标注册号不应包含特殊字符');
      return;
    }
    if (value && hanReg.test(value)) {
      callback('商标不应该包含汉字');
      return;
    }
    callback();
  };

  /**
   * @description: 商标名称校验
   * @param {*}
   * @return {*}
   */
  public trademarkNameValidator = (rule: any, value: any, callback: any) => {
    if (!value) {
      callback('请输入商标名称');
      return;
    }
    if (value && value.length > 50) {
      callback('商标注册号长度不超过50个字符');
      return;
    }
    const specialTypeReg = new RegExp("[`~!@#$^&*()=|{}':;',\\[\\].<>/?~！@#￥……&*（）——|{}【】‘；：”“'。，、？]");
    // const hanReg = /[\u4e00-\u9fa5]/;
    if (value && specialTypeReg.test(value)) {
      callback('商标注册号不应包含特殊字符');
      return;
    }
    // if(value && hanReg.test(value)){
    //   callback('商标不应该包含汉字');
    // }
    callback();
  };

  public render() {
    const formValue = this.state.brand;
    // 面包屑配置
    const BreadcrumbItems = [
      {
        title: '品牌资质',
        onClick: () => {
          this.goBack();
        },
      },
      {
        title: `${this.isAddTrade ? '商标添加' : '商标修改'}`,
      },
    ];

    return (
      <div className="brand-detail-container">
        <Breadcrumb items={BreadcrumbItems} />
        <div className="brand-detail-box">
          <div className="title">{this.isAddTrade ? '商标添加' : '商标修改'}</div>
          <RejectionReason list={this.state.rejectReason} />
          <div className="content">
            <Form
              // value={formValue}
              onFinish={(value) => {
                if (!value) {
                  this.submit(value); // 提交数据
                }
              }}
            >
              <Form.Item
                label="商标类型"
                // name='brandType'
                required
                rules={[
                  {
                    required: true,
                    message: '请选择商标类型',
                  },
                ]}
                shouldUpdate
              >
                {({ getFieldValue }) => {
                  return (
                    <RadioGroup
                      value={getFieldValue('brandType')}
                      onChange={(value: number) => {
                        if (value === BrandTypeEnum.自有商标) {
                          // setFieldValue('trademarkRegType', formValue.trademarkRegType);
                          // setFieldValue('brandAuthCertificates', formValue.brandAuthCertificates);
                          // setFieldValue('brandAuthExpiryDate', formValue.brandAuthExpiryDate);
                          // setFieldValue('ownerIdCertificates', formValue.ownerIdCertificates);
                        }
                        // validateForm();
                        // handleChange(value);
                      }}
                    >
                      {Array.from(BrandTypeMap.entries()).map(([value, label]) => {
                        return (
                          <Radio value={value} key={value}>
                            {label}
                            {' '}
                            <Tooltip title="自有品牌即品牌下的商标，其权利人是您的开店公司或者开店公司的法定代表人。若不是，则是授权品牌"><ExclamationCircleOutlined /></Tooltip>
                          </Radio>
                        );
                      })}
                    </RadioGroup>
                  );
                }}
              </Form.Item>
              {/* {({ submitForm, setFieldValue, getFieldValue, validateForm, validateField }: any) => (
                <form>
                  <div className='field-row'>
                    <Field
                      label='商标类型'
                      name='brandType'
                      required
                      rule={{
                        required: true,
                        message: '请选择商标类型',
                      }}
                    >
                      {({ value, handleChange }: any) => (
                        <>
                          <RadioGroup
                            value={value}
                            onChange={(value: number) => {
                              if (value === BrandTypeEnum.自有商标) {
                                setFieldValue('trademarkRegType', formValue.trademarkRegType);
                                setFieldValue('brandAuthCertificates', formValue.brandAuthCertificates);
                                setFieldValue('brandAuthExpiryDate', formValue.brandAuthExpiryDate);
                                setFieldValue('ownerIdCertificates', formValue.ownerIdCertificates);
                              }
                              validateForm();
                              handleChange(value);
                            }}
                          >
                            {Array.from(BrandTypeMap.entries).map(([value, label]) => (
                              <Radio value={value} key={value}>
                                {label}
                              </Radio>
                            ))}
                          </RadioGroup>
                          {getFieldValue('brandType') === BrandTypeEnum.授权商标 ? (
                            <div
                              style={{
                                lineHeight: 1.8,
                                width: 500,
                                fontSize: 12,
                                color: '#A2A4B3',
                                marginTop: '15px',
                              }}
                            >
                              <span>
                                自有品牌即品牌下的商标，其权利人是您的开店公司或者开店公司的法定代表人。若不是，则是授权品牌
                              </span>
                            </div>
                          ) : null}
                        </>
                      )}
                    </Field>
                  </div>
                  {getFieldValue('brandType') === BrandTypeEnum.授权商标 ? (
                    <>
                      <div className='field-row'>
                        <Field
                          label='商标注册人类型'
                          name='trademarkRegType'
                          required
                          rule={{
                            required: true,
                            message: '请选择商标注册人类型',
                          }}
                        >
                          {({ value, handleChange }: any) => (
                            <div className='trademarkRegType-radio-box'>
                              <RadioGroup
                                value={value}
                                onChange={async (value: number) => {
                                  if (value === trademarkRegTypeObj.NOT_NATURAL_PERSON) {
                                    await setFieldValue('ownerIdCertificates', formValue.ownerIdCertificates);
                                  }
                                  validateField('ownerIdCertificates');
                                  handleChange(value);
                                }}
                              >
                                {Array.from(TrademarkRegistrationTypeMap.entries()).map(([value, label]) => (
                                  <Radio value={value} key={value}>
                                    {label}
                                  </Radio>
                                ))}
                              </RadioGroup>
                            </div>
                          )}
                        </Field>
                      </div>
                      {getFieldValue('trademarkRegType') === trademarkRegTypeObj.NATURAL_PERSON ? (
                        <div className='field-row'>
                          <Field
                            label='商标持有人身份证明'
                            name='ownerIdCertificates'
                            required
                            rule={{
                              validator: (rule: any, value: any, callback: any) => {
                                this.ownerIdCertificatesValidator(rule, value, callback);
                              },
                            }}
                          >
                            {({ value, handleChange }: any) => (
                              <div className='id-card'>
                                <div className='id-card-box'>
                                  <div className='left'>
                                    <UploadImage
                                      bgUrl='https://p0.meituan.net/ingee/403586c98d34ff92ee8d4bd92c2641da1737.png'
                                      onChange={(val: string) => {
                                        handleChange([val, value[1]]);
                                      }}
                                      picUrl={value[0]}
                                      sizeMessage='电子商标持有人身份证件不得超过10MB'
                                    />
                                    <p className='id-card-prompt'>
                                      身份证 <b>人像面</b>
                                    </p>
                                  </div>
                                  <div className='right'>
                                    <UploadImage
                                      bgUrl='https://p0.meituan.net/ingee/c82b5a84ad108d249e9cd56719bd0ff21625.png'
                                      picUrl={value[1]}
                                      onChange={(val: string) => {
                                        handleChange([value[0], val]);
                                      }}
                                      sizeMessage='电子商标持有人身份证件不得超过10MB'
                                    />
                                    <p className='id-card-prompt'>
                                      身份证 <b>国徽面</b>
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </Field>
                        </div>
                      ) : null}
                    </>
                  ) : null}
                  <div className='field-row'>
                    <Field
                      label='商标注册证明'
                      name='trademarkRegCertificates'
                      required
                      rule={{
                        validator: (rule: any, value: any, callback: any) => {
                          this.trademarkRegCertificatesValidator(rule, value, callback);
                        },
                      }}
                    >
                      {({ value, handleChange }: any) => {
                        const max = 10;
                        const transValue = value.length < max ? [...value, ''] : value;
                        return (
                          <>
                            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                              {transValue.map((url: string, idx: number) => (
                                <UploadImage
                                  onChange={(val: string) => {
                                    if (val) {
                                      transValue.pop();
                                      transValue.push(val);
                                      transValue.length < max && transValue.push('');
                                    } else {
                                      transValue.splice(idx, 1);
                                      transValue[transValue.length - 1] && transValue.push('');
                                    }
                                    const res = !transValue[transValue.length - 1]
                                      ? transValue.slice(0, -1)
                                      : transValue;
                                    handleChange(res);
                                  }}
                                  sizeMessage='商标注册证明文件过大，不得超过10MB，请重新上传'
                                  picUrl={url}
                                />
                              ))}
                            </div>
                            {trademarkRegCertificatesText()}
                          </>
                        );
                      }}
                    </Field>
                  </div>
                  {
                    // getFieldValue('brandType') === brandTypeObj.OWN &&
                    getFieldValue('trademarkRegCertificates') && getFieldValue('trademarkRegCertificates').length ? (
                      <>
                        <div className='field-row'>
                          <Field
                            label='商标名称'
                            name='trademarkName'
                            required
                            rule={{
                              validator: (rule: any, value: any, callback: any) => {
                                this.trademarkNameValidator(rule, value, callback);
                              },
                            }}
                            as={<Input />}
                          />
                        </div>
                        <div className='field-row' style={{ marginBottom: '14px' }}>
                          <Field
                            label='商标注册号'
                            name='trademarkCode'
                            required
                            rule={{
                              validator: (rule: any, value: any, callback: any) => {
                                this.trademarkCodeValidator(rule, value, callback);
                              },
                            }}
                            as={<Input />}
                          />
                        </div>
                        <div className='field-row' style={{ marginBottom: '14px' }}>
                          <Field
                            label='商标注册证明有效期'
                            name='trademarkRegExpiryDate'
                            required
                            rule={{
                              validator: (rule: any, value: any, callback: any) => {
                                this.trademarkRegExpiryDateValidator(rule, value, callback);
                              },
                            }}
                          >
                            {({ value, handleChange }: any) => (
                              <div id='range-time-container' style={{ width: 200 }}>
                                <DatePicker
                                  format='YYYY-MM-DD'
                                  valueOfType='string'
                                  placeholder='请选择日期'
                                  value={value}
                                  onChange={handleChange}
                                  disabledDate={cur => this.disabledCondition(cur)}
                                  popupContainer={() => document.querySelector('#range-time-container')}
                                />
                              </div>
                            )}
                          </Field>
                        </div>
                      </>
                    ) : null
                  }
                  {getFieldValue('brandType') === BrandTypeEnum.授权商标 ? (
                    <>
                      <div className='field-row'>
                        <Field
                          label='品牌授权证明'
                          name='brandAuthCertificates'
                          required
                          rule={{
                            validator: (rule: any, value: any, callback: any) => {
                              this.brandAuthCertificatesValidator(rule, value, callback);
                            },
                          }}
                        >
                          {({ value, handleChange }: any) => {
                            const max = 10;
                            const transValue = value.length < max ? [...value, ''] : value;
                            return (
                              <>
                                <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                                  {transValue.map((url: string, idx: number) => (
                                    <UploadImage
                                      onChange={(val: string) => {
                                        if (val) {
                                          transValue.pop();
                                          transValue.push(val);
                                          transValue.length < max && transValue.push('');
                                        } else {
                                          transValue.splice(idx, 1);
                                          transValue[transValue.length - 1] && transValue.push('');
                                        }
                                        const res = !transValue[transValue.length - 1]
                                          ? transValue.slice(0, -1)
                                          : transValue;
                                        handleChange(res);
                                      }}
                                      sizeMessage='品牌授权证明文件过大，不得超过10MB，请重新上传'
                                      picUrl={url}
                                    />
                                  ))}
                                </div>
                              </>
                            );
                          }}
                        </Field>
                      </div>
                    </>
                  ) : null}
                  {getFieldValue('brandType') === BrandTypeEnum.授权商标 &&
                  getFieldValue('brandAuthCertificates') &&
                  getFieldValue('brandAuthCertificates').length ? (
                      <div className='field-row' style={{ marginBottom: '14px' }}>
                        <Field
                          label='品牌注册证明有效期'
                          name='brandAuthExpiryDate'
                          required
                          rule={{
                            validator: (rule: any, value: any, callback: any) => {
                              this.brandAuthExpiryDateValidator(rule, value, callback);
                            },
                          }}
                        >
                          {({ value, handleChange }: any) => (
                            <>
                              <div id='range-time-containert' style={{ width: 200 }}>
                                <DatePicker
                                  format='YYYY-MM-DD'
                                  valueOfType='string'
                                  placeholder='请选择日期'
                                  value={value}
                                  onChange={handleChange}
                                  disabledDate={cur => this.disabledCondition(cur)}
                                  popupContainer={() => document.querySelector('#range-time-containert')}
                                />
                              </div>
                              <div style={{ color: 'var(--text-color-weak)', marginTop: 10 }}>
                              请填写授权链路中最后一个授权书的有效期
                              </div>
                            </>
                          )}
                        </Field>
                      </div>
                    ) : null}
                  <div style={{ height: '60px', width: '100%' }} />
                  <ButtonTab
                    config={[
                      {
                        text: '提交',
                        func: submitForm,
                        type: 'normal',
                        key: 'submit',
                      },
                      {
                        text: '取消',
                        func: this.cancle,
                        type: 'hollow',
                        key: 'cancle',
                      },
                    ]}
                  />
                </form>
              )} */}

              <ButtonTab
                config={
                  [
                    {
                      text: '提交',
                      // func: submitForm,
                      type: 'normal',
                      key: 'submit',
                    },
                    {
                      text: '取消',
                      func: this.cancle,
                      type: 'hollow',
                      key: 'cancle',

                    },
                  ]
                }
              />
            </Form>
          </div>
        </div>
      </div>
    );
  }
}

export default AddBrand;
