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
      const React = (await import('market/newReact'));
      const ReactDOM = (await import('market/newReactDOM'));
      const RemoteComponent = await this.props.importer();
      const { importer, children, ...props } = this.props;

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
