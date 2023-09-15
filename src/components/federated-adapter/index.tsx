/* eslint-disable @typescript-eslint/ban-ts-comment */
/**
 * 模块联邦组件适配器
 * 解决 非法Hook调用 的问题
 * 
 * sobird<i@sobird.me> at 2023/09/15 12:01:38 created.
 */

import { Component, PropsWithChildren, LazyExoticComponent, ComponentType } from "react";

interface FederatedAdapterProps {
  component: LazyExoticComponent<ComponentType<any>>;
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
    const React = await import('market/newReact');
    // @ts-ignore
    const ReactDOM = await import('market/newReactDOM');
    ReactDOM.createRoot(this.refHold).render(React.createElement(component, props, children));
  }

  componentDidUpdate() {
    //
  }

  componentDidMount() {
    this.init();
  }

  render() {
    return (
      <div className="federated-adapter" ref={(ref) => (this.refHold = ref)}></div>
    )
  }
}

export default FederatedAdapter;
