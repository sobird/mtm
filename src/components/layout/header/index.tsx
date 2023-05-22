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
          </div>
          <nav className="header-nav">
            <div>
            <Fullscreen />
            </div>

            <div className="avatar">
              <Popover
                overlayClassName="avatar-popover"
                trigger="click"
                content={(
                  <ul>
                    <li>{userInfo.name} / {userInfo.mis}</li>
                    <li className="divided" />
                    <li>
                      <a href="/logout">
                        退出
                        <i className="iconfont icon-sign-out pull-right" />
                      </a>
                    </li>
                  </ul>
                )}
                placement="bottomRight"
              >
                <img
                  src={`https://gravatar.sobird.me/avatar/b5c9ccc6a294ab482e9709d4f6c0eb40?s=64&d=mm&r=g`}
                />
              </Popover>
            </div>
          </nav>
        </div>
      </header>
    );
  }
}

export default Header;
