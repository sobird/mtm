/**
 * 自定义组件测试
 *
 * sobird<i@sobird.me> at 2023/10/23 10:55:03 created.
 */

import { Page } from '@mtm/shared';
import { Empty as AntdEmpty, Divider } from 'antd';
import { Empty } from '@mtm/shared';

const Component = () => {
  return (
    <Page title='组件' description='组件测试，演示'>
      <AntdEmpty description='暂无数据信息'>这里是内容</AntdEmpty>

      <Divider />

      <Empty description='暂无数据信息' imageStyle={{}}>
        这里是内容
      </Empty>
    </Page>
  );
};

export default Component;
