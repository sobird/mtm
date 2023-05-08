/**
 * Redux Sample
 *
 * sobird<i@sobird.me> at 2023/05/08 23:41:11 created.
 */

import React from "react";
import { connect } from "react-redux";
import { IStoreState } from "./store/reducers";
import { User } from "./store/reducers/app";
import { bindActionCreators } from "redux";

import * as actionCreator from "./store/actions/app";

type IReduxProps = {
  user?: User;
} & typeof actionCreator

class Redux extends React.Component<IReduxProps> {
  componentDidMount() {
    console.log(this);
  }

  render() {
    const { setUser } = this.props;
    return (
      <div className="Redux">
        <h2>Redux</h2>
        <p>用户名：{this.props.user?.name}</p>
        <button
          onClick={() => {
            setUser({ name: "杨军龙" });
          }}
        >
          设置用户
        </button>
      </div>
    );
  }
}

const mapStateToProps = (state: IStoreState) => {
  return { user: state.app.user };
};
const mapDispatchToProps = (dispatch: never) =>
  bindActionCreators(actionCreator, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(Redux);
