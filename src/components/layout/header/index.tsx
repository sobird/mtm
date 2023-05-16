/*
 * 通用头部组件
 *
 * sobird<i@sobird.me> at 2021/06/24 15:15:44 created.
 */

import React from 'react';
import { Popover } from 'antd';

import './index.scss';

import Environmen from '@/components/environment';
import Fullscreen from '@/components/fullscreen';

// import { login } from '@/model/index';

class Header extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      userInfo: {},
    };
  }

  componentDidMount() {
    // login().then((data: any) => {
    //   console.log('data', data);
    //   this.setState({
    //     userInfo: data.userInfo,
    //   });
    // });
  }

  render() {
    const { userInfo } = this.state;
    return (
      <header className="header">
        <div className="header-brand">
          <a href="/" title="团好货选品系统">
            <span className="logo">
              <i className="iconfont icon-check-circle-s" />
            </span>
            <span className="text">商家管理后台</span>
          </a>
        </div>

        <div className="header-bread">
          <div className="header-bar">
            <Environmen />
            <Fullscreen />
          </div>
          <nav className="header-nav">
            <div>
              <a href="https://km.sankuai.com/page/847012387" target="_blank">
                使用说明
              </a>
            </div>

            {/* <div className="avatar">
              <Popover
                overlayClassName="avatar-popover"
                trigger="click"
                content={(
                  <ul>
                    <li>{userInfo.name} / {userInfo.mis}</li>
                    <li className="divided" />
                    <li>
                      <a href="/sso/logout">
                        退出
                        <i className="iconfont icon-sign-out pull-right" />
                      </a>
                    </li>
                  </ul>
                )}
                placement="bottomRight"
              >
                <img
                  src={`https://serverless.sankuai.com/dx-avatar/?type=img&mis=${userInfo.mis}`}
                />
              </Popover>
            </div> */}
          </nav>
        </div>
      </header>
    );
  }
}

export default Header;
