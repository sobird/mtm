/**
 * 工作台 - 实时数据
 *
 * sobird<i@sobird.me> at 2023/10/12 9:23:24 created.
 */
import Card from '../components/card';

const gridStyle: React.CSSProperties = {
  width: '25%',
  textAlign: 'center',
};

const RealData = () => {
  return (
    <Card
      title='实时数据'
      subTitle='数据计算可能会存在5-10分钟左右的延迟'
      extra={<a>数据中心</a>}
      bodyStyle={{
        height: 90
      }}
    >
      <Card.Grid style={gridStyle}>实时数据<div>ddd</div></Card.Grid>
      <Card.Grid style={gridStyle}>实时数据<div>ddd</div></Card.Grid>
      <Card.Grid style={gridStyle}>实时数据<div>ddd</div></Card.Grid>
    </Card>
  );
};

export default RealData;
