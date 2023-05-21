/*
 * 侧边栏导航组件
 *
 * sobird<i@sobird.me> at 2021/06/23 21:11:52 created.
 */
import { useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Link,
} from 'react-router-dom';
import { Button, Menu } from 'antd';
import './index.scss';

import { IStoreState } from '@/store/reducers';
import * as actionCreators from '@/store/actions/app';

export default function Aside() {
  // const location = useLocation();
  const dispatch = useDispatch();
  const { collapsed } = useSelector((state: IStoreState) => state.app);

  // dispach action
  const toggleAside = useCallback(
    () => dispatch(actionCreators.toggleAside()),
    [dispatch],
  );

  console.log('location', location)

  return (
    <aside>
      <div className="menu-container">
        <Menu
          mode="inline"
          inlineCollapsed={collapsed}
          defaultSelectedKeys={[location.pathname]}
        >
          <Menu.Item key="/" icon={<i className="iconfont icon-tags-s" />}>
            <Link to="/">
              首页
            </Link>
          </Menu.Item>
          <Menu.Item key="/about" icon={<i className="iconfont icon-commodity" />}>
            <Link to="/about">
              关于
            </Link>
          </Menu.Item>
        </Menu>
      </div>

      <Button
        type="text"
        className="hamburger"
        onClick={
          toggleAside
        }
      >
        <i className="iconfont icon-bars-s" />
      </Button>
    </aside>
  );
}
