/**
 * 用于调试 远程组件
 *
 * sobird<i@sobird.me> at 2023/10/11 19:11:13 created.
 */
import { Row, Col, Card } from 'antd';
import Campaign from '@/remotes/campaign';
import LatestNews from '@/remotes/latest-news';
import RealData from '@/remotes/workbench/realdata';
import OverView from '@/remotes/workbench/overview';
import MerchantGrowth from '@/remotes/merchant-growth';
import Violations from '@/remotes/violations';
import ProductManage from '@/remotes/product-manage';
import TrendingChart from '@/remotes/trending-chart';
import FundManage from '@/remotes/fund-manage';

const Home = () => {
  return (
    <Row gutter={[10, 10]}>
      <Col span={24}>
        <Card title="最新动态"><LatestNews/></Card>
      </Col>

      <Col span={24}>
        <Card title="订单概况"><OverView /></Card>
      </Col>

      <Col span={12}>
        <Card title="实时数据" extra={<a>数据中心</a>}><RealData/></Card>
      </Col>
      <Col span={12}>
        <Card title="店铺提升"><MerchantGrowth /></Card>
      </Col>
      <Col span={12}>
        <Card title="违规情况"><Violations /></Card>
      </Col>
      <Col span={12}>
        <Card title="商品管理"><ProductManage className="test" /></Card>
      </Col>
      <Col span={12}>
        <Card title="经营趋势"><TrendingChart /></Card>
      </Col>
      <Col span={12}>
        <Card title="资金管理"><FundManage /></Card>
      </Col>
      <Col span={12}>
        <Card title='营销活动'>
          <Campaign />
        </Card>
      </Col>
    </Row>
  );
};

export default Home;
