/**
 * 侧边栏导航组件
 * 
 * sobird<i@sobird.me> at 2023/09/12 15:46:42 created.
 */

import React from "react";
import { Button, Menu } from "antd";
import { AppstoreOutlined, SettingOutlined, MenuFoldOutlined, MenuUnfoldOutlined } from "@ant-design/icons";
import { Link } from "react-router-dom";

import "./index.scss";

const Aside: React.FunctionComponent = () => {
  return (
    <aside className="app-aside">
      <div className="app-menu">
        <Menu
          mode="inline"
          //inlineCollapsed={collapsed}
          defaultSelectedKeys={[location.pathname]}
        >
          <Menu.Item key="/" icon={<AppstoreOutlined />}>
            <Link to="/">首页</Link>
          </Menu.Item>
          <Menu.Item
            key="/about"
            icon={<SettingOutlined />}
          >
            <Link to="/about">关于</Link>
          </Menu.Item>
          <Menu.Item
            key="/setting"
            icon={<SettingOutlined />}
          >
            <Link to="/setting">设置</Link>
          </Menu.Item>
        </Menu>
      </div>
    </aside>
  )
}

export default Aside;
