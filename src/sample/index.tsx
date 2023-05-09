/**
 * 样例
 * 
 * sobird<i@sobird.me> at 2023/05/09 12:03:45 created.
 */

import React from "react";
import ReduxSample from './redux';
import RouteSample from './route';

class Sample extends React.Component {
  render(): React.ReactNode {
    return (
      <div>
        <h1>Sample</h1>
        <ReduxSample></ReduxSample>
        <RouteSample></RouteSample>
      </div>
    )
  }
}

export default Sample;
