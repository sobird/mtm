/**
 * 商品管理 卡片组件
 * 
 * @todo
 * 跳转权限
 * 获取shopInfo
 * 
 * sobird<i@sobird.me> at 2023/10/13 18:20:25 created.
 */

import React, { ComponentProps, useEffect, useState } from 'react';
import { message } from 'antd';
// import { openNewTab } from '@util/agent';
import { Card } from '@mtm/shared';;
import ProductService from '@/services/product';

import './index.scss';

export interface ProductManageCardProps extends ComponentProps<typeof Card> {
  callback?: (data: any) => any;
}

const ProductManageCard: React.FunctionComponent<ProductManageCardProps> = ({callback, ...props}) => {
  const [inSellCount, setInSellCount] = useState<number>();
  const pathMap = {};
  const poiId = 123;

  useEffect(() => {
    ProductService.selling().then(res => {
      setInSellCount(res.total);
      callback?.(res);
    }).catch((e) => {
      message.error(e.msg || e.message || '获取在售商品数异常');
    });
  }, []);

  return (
    <Card classCard='product-manage-card' title='商品管理' {...props}>
      <Card.Grid
        className='item'
        onClick={() => {
          if (!pathMap['/product/list']) {
            message.error('当前跳转页面无权限，请联系主账户进行开通');
            return;
          }
          // openNewTab('/product/list');
        }}
      >
        <span>
          <span className='on-sale'>{inSellCount || '--'}</span>件
        </span>
        <span className='on-sale-text'>在售中</span>
      </Card.Grid>
      <Card.Grid
        className='item'
        onClick={() => {
          if (!pathMap['/product/create']) {
            message.error('当前跳转页面无权限，请联系主账户进行开通');
            return;
          }
          // openNewTab('/product/create');
        }}
      >
        <i className='icon iconfont icon-new-add'></i>
        <span className='create-product-text'>创建新商品</span>
      </Card.Grid>
    </Card>
  );
};

export default ProductManageCard;
