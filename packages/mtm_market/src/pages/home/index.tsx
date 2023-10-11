/**
 * 用于调试 远程组件
 *
 * sobird<i@sobird.me> at 2023/10/11 19:11:13 created.
 */
import { Row, Col, Card } from 'antd';
import Campaign from '@/remotes/campaign';
import LatestNews from '@/remotes/latest-news';

const Home = () => {
  return (
    <Row gutter={[10, 10]}>
      <Col span={24}>
        <Card title="最新动态"><LatestNews/></Card>
      </Col>
      <Col span={12}>
        <Card title='营销活动'>
          <Campaign />
        </Card>
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
