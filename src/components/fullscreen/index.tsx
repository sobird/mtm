/**
 * 网页全屏组件
 *
 * sobird<i@sobird.me> at 2021/06/23 19:43:42 created.
 */
import React from 'react';
import { message } from 'antd';
import { FullscreenOutlined, FullscreenExitOutlined} from '@ant-design/icons'
import screenfull from 'screenfull';

import './index.scss';

class Environment extends React.PureComponent<any, any> {
  constructor(props: any) {
    super(props);
    this.state = {
      isFullscreen: false,
    };
  }

  componentDidMount() {
    if (screenfull.isEnabled) {
      screenfull.on('change', this.change);
    }
  }

  componentWillUnmount() {
    if (screenfull.isEnabled) {
      screenfull.off('change', this.change);
    }
  }

  change() {
    this.setState({
      isFullscreen: (screenfull as any).isFullscreen,
    });
  }

  toggle = () => {
    if (!screenfull.isEnabled) {
      message.warning('you browser can not work');
    }
    (screenfull as any).toggle().then(() => {
      this.change();
    });
  };

  render() {
    const { isFullscreen } = this.state;
    return (
      isFullscreen ? <FullscreenExitOutlined onClick={this.toggle}/> : <FullscreenOutlined onClick={this.toggle}/>
    );
  }
}

export default Environment;
