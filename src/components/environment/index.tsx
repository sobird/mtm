/*
 * 系统环境切换组件
 *
 * sobird<i@sobird.me> at 2021/06/23 17:55:10 created.
 */

import React from "react";
import { Dropdown, MenuProps } from "antd";
import { DownOutlined } from "@ant-design/icons";

import "./index.scss";

class Environment extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      env: {
        value: "local",
        label: "本地",
      },
      envs: [],
    };
  }

  items = [
    {
      value: 'prod',
      label: '线上',
      url: '//mtm.example.com',
    },
    {
      value: 'staging',
      label: '备机',
      url: '//mtm.st.example.com',
    },
    {
      value: 'test',
      label: '线下',
      url: '//mtm.test.example.com',
    },
  ];

  

  componentDidMount() {
    const href = window.location.href;
    const { items }  = this;

    const _envs: any = [];

    items.forEach((item) => {
      const _item = {
        key: item.url,
        label: (
          <a href={item.url}>{ item.label }/{ item.value }</a>
        )
      };
      if (href.indexOf(item.url) > -1) {
        this.setState({
          env: item,
        });
      } else {
        _envs.push(_item);
      }
    });

    this.setState({
      envs: _envs,
    });
  }

  render() {
    const { env, envs } = this.state;

    return (
      <Dropdown menu={{ items: envs }} overlayClassName="dropdown-env">
        <div className="environment">
          <div className="env-tag">
            <span className="env-tag-cn">{env.label}</span>
            <span className="env-tag-en">{env.value}</span>
          </div>
          <DownOutlined />
        </div>
      </Dropdown>
    );
  }
}

export default Environment;
