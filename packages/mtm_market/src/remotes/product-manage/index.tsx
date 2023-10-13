/**
 * 商品管理
 * 
 * @todo
 * icon 替换优化
 * 跳转权限
 * 获取shopInfo
 * 
 * sobird<i@sobird.me> at 2023/10/13 18:20:25 created.
 */

import React, { useEffect, useState } from 'react';
import { message } from 'antd';
// import { openNewTab } from '@util/agent';
import NewProductSvg from './assets/new.svg';
import Card from '../workbench/components/card';
import ProductService from '@/services/product';

import './index.scss';

const ProductManage: React.FunctionComponent = () => {
  const [inSellCount, setInSellCount] = useState<number>();
  const pathMap = {};
  const poiId = 123;

  useEffect(() => {
    ProductService.selling().then(res => {
      setInSellCount(res.total);
    }).catch((e) => {
      message.error(e.msg || e.message || '获取在售商品数异常');
    });
  }, []);

  return (
    <Card className='product-manage' title='商品管理'>
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
          if (!pathMap['/product/list']) {
            message.error('当前跳转页面无权限，请联系主账户进行开通');
            return;
          }
          // openNewTab('/product/create');
        }}
      >
        <img src={NewProductSvg} />
        <span className='create-product-text'>创建新商品</span>
      </Card.Grid>
    </Card>
  );
};

export default ProductManage;
