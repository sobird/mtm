/**
 * 工作台 - 实时数据
 *
 * sobird<i@sobird.me> at 2023/10/12 9:23:24 created.
 */
import Card from '../components/card';
import { Tooltip } from 'antd';
import useWorkbench from '../hooks/useWorkbench';
import './index.scss';

interface RealDataConfigProps {
  title: string;
  tips: string;
  key: string;
  unit: string;
  format?: string;
  dealType: string;
  extra?: React.ReactNode;
}

const realDataConfigRow1: RealDataConfigProps[] = [
  {
    title: '支付金额',
    tips: '该店铺支付订单的总金额，包含买家实际支付和使用平台优惠券的总金额，未剔除售后订单',
    key: 'paidAmount',
    unit: '元',
    format: 'money',
    dealType: 'paidAmount',
  },
  {
    title: '支付订单数',
    tips: '店铺全部支付的订单数，一个支付订单对应唯一订单号，一个买家在统计时间内支付多个订单则记为多次',
    key: 'paidOrderCount',
    unit: '单',
    format: 'number',
    dealType: 'paidOrderCount',
  },
  {
    title: '支付人数',
    tips: '该店铺所有支付买家的去重人数，即一个买家多次支付，仅记一人，未剔除售后订单',
    key: 'paidUserCount',
    unit: '人',
    format: 'number',
    dealType: 'paidUserCount',
  },
];

const realDataConfigRow2: RealDataConfigProps[] = [
  {
    title: '商品访客数',
    tips: '统计周期内，访问店铺所有商品的去重人数',
    key: 'itemUniqueVisitor',
    unit: '人',
    format: 'number',
    dealType: 'itemUniqueVisitor',
  },
  {
    title: '商品浏览量',
    tips: '统计周期内，该店铺内所有商品详情页的被访问累加人次',
    key: 'itemPaveView',
    unit: '次',
    format: 'number',
    dealType: 'itemPaveView',
  },
  {
    title: '支付转化率',
    tips: '统计周期内，支付买家数/访客数，即访客用户数转化为支付买家的比例',
    key: 'conversionRate',
    unit: '%',
    dealType: 'conversionRate',
    extra: <a>如何提高转化率</a>,
  },
];

const RealData = () => {
  const { loading, realdata } = useWorkbench();
  console.log('realdata', realdata, loading);
  return (
    <Card
      title='实时数据'
      subTitle='数据计算可能会存在5-10分钟左右的延迟'
      extra={<a>数据中心</a>}
      bodyStyle={
        {
          // height: 110,
        }
      }
    >
      <div className='real-data-panel'>
        {realDataConfigRow1.map(item => (
          <Card.View
            key={item.key}
            title={
              <Tooltip title={<span style={{ color: '#333', fontSize: 12 }}>{item.tips}</span>} color='#fff'>
                {item.title}
              </Tooltip>
            }
            unit={item.unit}
            value={realdata[item.key]}
            extra={item.extra}
          ></Card.View>
        ))}
      </div>

      <div className='real-data-panel'>
        {realDataConfigRow2.map(item => (
          <Card.View
            key={item.key}
            title={
              <Tooltip title={<span style={{ color: '#333', fontSize: 12 }}>{item.tips}</span>} color='#fff'>
                {item.title}
              </Tooltip>
            }
            unit={item.unit}
            value={realdata[item.key]}
            extra={item.extra}
          ></Card.View>
        ))}
      </div>
    </Card>
  );
};

export default RealData;
