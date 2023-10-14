/**
 * 订单概况
 * 
 * @todo
 * 完善点击跳转
 * poiId 获取
 * 
 * sobird<i@sobird.me> at 2023/10/12 18:08:57 created.
 */


import { Tooltip } from 'antd';
import Card from '../components/card';
import useWorkbench from '../hooks/useWorkbench';
import './index.scss';

interface OverViewProps {
  title: string;
  tips?: string;
  key: string;
  unit?: string;
  orderStatus?: number;
  afterStatus?: number;
  extra?: React.ReactNode;
}

const OverViewConfig: OverViewProps[] = [
  {
    title: '待付款',
   //  tips: '所有当前进入支付页但未支付的订单数',
    key: 'unpaidOrderCount',
    unit: '单',
    orderStatus: 9,
  },
  {
    title: '待发货',
    tips: '近90天内的所有待发货订单数',
    key: 'unfilledOrderCount',
    unit: '单',
    orderStatus: 2,
  },
  {
    title: '退款/售后',
    tips: '近90天所有处在售后和退款中的订单数',
    key: 'refundOrderCount',
    unit: '单',
    afterStatus: 3,
  },
  {
    title: '即将延迟发货',
    tips: '近90天数据即将会延迟发货的订单数',
    key: 'willDelayDeliverOrderCount',
    unit: '单',
    afterStatus: 3,
  },
  {
    title: '已延期发货',
    tips: '近90天已过承诺发货时间的订单数',
    key: 'alreadyDelayDeliverOrderCount',
    unit: '单',
    afterStatus: 3,
  },
];

const OverView = () => {
  const { loading, overview } = useWorkbench();

  return (
    <Card classCard='over-view-card'>
      <div className='over-view-panel'>
        {OverViewConfig.map(item => (
          <Card.View
            key={item.key}
            title={item.title}
            tooltip={{
              title: item.tips
            }}
            unit={item.unit}
            value={overview[item.key]}
            extra={item.extra}
          ></Card.View>
        ))}
      </div>
    </Card>
  );
};

export default OverView;
