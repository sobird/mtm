/**
 * 模块联邦组件适配器
 * 
 * sobird<i@sobird.me> at 2023/09/15 12:01:38 created.
 */

import React, { Component } from "react";


interface AdapterProps {
  importer: () => void;
  children: React.ReactNode;
}

class Adapter extends Component {
  refHold: HTMLDivElement;
  constructor(props: AdapterProps) {
    super(props);
    this.refHold;
  }

  init = () => {
    (async () => {
      const R = await import('app1/newReact');
      const React = (await import('app1/newReact'));
      const ReactDOM = (await import('app1/newReactDOM'));
      const RemoteComponent = await this.props.importer();
      const { importer, children, ...props } = this.props;


      console.log('RemoteComponent', RemoteComponent)

      ReactDOM.createRoot(this.refHold).render(React.createElement(RemoteComponent, props, children))
    })()
  }

  componentDidUpdate(prevProps: Readonly<{}>, prevState: Readonly<{}>, snapshot?: any): void {
    //
  }

  componentDidMount(): void {
    //
    this.init();
  }

  render(): React.ReactNode {
    return (
      <div ref={(ref) => (this.refHold = ref)}></div>
    )
  }
}

export default Adapter;
