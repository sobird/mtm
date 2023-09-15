/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * 模块联邦组件适配器
 * 
 * sobird<i@sobird.me> at 2023/09/15 12:01:38 created.
 */

import React, { Component, PropsWithChildren } from "react";

interface FederatedAdapterProps {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
}

class FederatedAdapter extends Component<PropsWithChildren<FederatedAdapterProps>> {
  refHold: HTMLDivElement;
  constructor(props: FederatedAdapterProps) {
    super(props);
    this.refHold;
  }

  init = async () => {
    const { component, children, ...props } = this.props;
    // @ts-ignore
    const React = (await import('market/newReact'));
    // @ts-ignore
    const ReactDOM = (await import('market/newReactDOM'));

    ReactDOM.createRoot(this.refHold).render(React.createElement(component, props, children));
  }

  componentDidUpdate() {
    //
  }

  componentDidMount() {
    this.init();
  }

  render(): React.ReactNode {
    return (
      <div className="federated-adapter" ref={(ref) => (this.refHold = ref)}></div>
    )
  }
}

export default FederatedAdapter;
