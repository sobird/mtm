/*
 * 系统环境切换组件
 *
 * sobird<i@sobird.me> at 2021/06/23 17:55:10 created.
 */

import React from 'react';
import { Popover } from 'antd';

import './index.scss';

class Environment extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      env: {
        value: 'local',
        label: '本地环境',
      },
    };
  }

  envs = [
    {
      value: 'prod',
      label: '线上',
      url: '//canal.sankuai.com/',
    },
    {
      value: 'staging',
      label: '线上',
      url: '//canal.thh.st.sankuai.com/',
    },
    {
      value: 'test',
      label: '线下',
      url: '//canal.thh.test.sankuai.com/',
    },
  ];

  componentDidMount() {
    const href = window.location.href;

    const _envs: any = [];
    this.envs.forEach((item) => {
      if (href.indexOf(item.url) > -1) {
        this.setState({
          env: item,
        });
      } else {
        _envs.push(item);
      }
    });

    this.envs = _envs;
  }

  render() {
    const { env } = this.state;

    return (
      <Popover
        overlayClassName="popover-env"
        content={(
          <ul>
            {this.envs.map((item) => (
              <li key={item.value}><a href={item.url}>{ item.label }/{ item.value }</a></li>
            ))}
          </ul>
        )} placement="bottomLeft"
      >
        <div className="environment">
          <div className="env-tag">
            <span className="env-tag-cn">{ env.label }</span>
            <span className="env-tag-en">{ env.value }</span>
          </div>
          <i className="el-icon-arrow-down el-icon--right" />
        </div>
      </Popover>
    );
  }
}

export default Environment;
