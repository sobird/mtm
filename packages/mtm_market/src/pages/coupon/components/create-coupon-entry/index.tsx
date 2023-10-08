/**
 * 创建优惠券按钮组件
 *
 * sobird<i@sobird.me> at 2023/10/06 10:14:08 created.
 */

import React, { useState, PropsWithChildren, ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import classnames from 'classnames';
import { Button, Modal } from 'antd';
import { CouponTargetEnum } from '@/services/coupon';

import IconCouponTarget1 from './images/coupon_target_1.png';
import IconCouponTarget2 from './images/coupon_target_2.png';
import IconCouponTarget3 from './images/coupon_target_3.png';

import './index.scss';

/** 新建优惠券 入口按钮 */
const CreateCouponEntry: React.FC<PropsWithChildren<ComponentProps<typeof Button>>> = ({ children, ...props}) => {
  const [open, setOpen] = useState(false);
  const [couponTarget, setCouponTarget] = useState(0);
  const navigate = useNavigate();

  return (
    <>
      <Button {...props} onClick={() => setOpen(true)}>{children}</Button>
      <Modal
        title='请选择券类型'
        cancelText='取消'
        okText='下一步'
        open={open}
        onCancel={() => setOpen(false)}
        onOk={() => {
          setOpen(false);
          navigate(`/coupon/create?target=${couponTarget}`);
        }}
        closable
        okButtonProps={{ disabled: couponTarget === 0 }}
        transitionName=""
        maskTransitionName=""
      >
        <div
          className={classnames('coupon-target-item', {
            'coupon-target-active': couponTarget === CouponTargetEnum.店铺商品券,
          })}
          onClick={() => {
            setCouponTarget(CouponTargetEnum.店铺商品券);
          }}
        >
          <div className='target-icon'>
            <img src={IconCouponTarget1} />
          </div>
          <div className='target-text'>
            <h4>店铺商品券</h4>
            <p>发放店铺商品促销优惠券，提升商品转化，带动商品销量，用户可在商详页、IM等渠道领券后使用</p>
          </div>

          <div className='sup-mark' />
        </div>

        <div
          className={classnames('coupon-target-item', {
            'coupon-target-active': couponTarget === CouponTargetEnum.店铺通用券,
          })}
          onClick={() => {
            setCouponTarget(CouponTargetEnum.店铺通用券);
          }}
        >
          <div className='target-icon'>
            <img src={IconCouponTarget2} />
          </div>
          <div className='target-text'>
            <h4>店铺通用券</h4>
            <p>发放店铺通用优惠券，提升店铺整体转化效果，用户可在商详页等渠道领取后使用</p>
          </div>
          <div className='sup-mark' />
        </div>

        <div
          className={classnames('coupon-target-item', {
            'coupon-target-active': couponTarget === CouponTargetEnum.店铺客服体验券,
          })}
          onClick={() => {
            setCouponTarget(CouponTargetEnum.店铺客服体验券);
          }}
        >
          <div className='target-icon'>
            <img src={IconCouponTarget3} />
          </div>
          <div className='target-text'>
            <h4>店铺客服体验券</h4>
            <p>发放用户安慰、赔付、奖励优惠券，提升用户服务体验，强化客户关系，用户可在IM客服渠道领券后使用</p>
          </div>
          <div className='sup-mark' />
        </div>
      </Modal>
    </>
  );
};

export default CreateCouponEntry;
