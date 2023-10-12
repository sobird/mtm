/**
 * 工作台 - 实时数据
 *
 * sobird<i@sobird.me> at 2023/10/12 9:23:24 created.
 */
import Card from '../components/card';
import { Tooltip } from 'antd';

const gridStyle: React.CSSProperties = {
  width: '25%',
};

const RealData = () => {
  return (
    <Card
      title='实时数据'
      subTitle='数据计算可能会存在5-10分钟左右的延迟'
      extra={<a>数据中心</a>}
      bodyStyle={
        {
          // height: 90
        }
      }
    >
      <Card.Grid style={gridStyle}>
        <Card.View
          title={
            <Tooltip title={<span style={{ color: '#333', fontSize: 12 }}>所有当前进入支付页但未支付的订单数</span>} color='#fff'>
              <span>待付款</span>
            </Tooltip>
          }
          unit='元'
          value={23}
          extra={<a>如何提高转化率</a>}
        ></Card.View>
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        <Card.View
          title={
            <Tooltip title={<span style={{ color: '#333', fontSize: 12 }}>近90天内的所有待发货订单数</span>} color='#fff'>
              <span>待发货</span>
            </Tooltip>
          }
          unit='单'
          value={68}
        ></Card.View>
      </Card.Grid>
      <Card.Grid style={gridStyle}>
        实时数据<div>ddd</div>
      </Card.Grid>
    </Card>
  );
};

export default RealData;
