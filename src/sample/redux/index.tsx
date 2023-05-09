/**
 * Redux Sample
 *
 * sobird<i@sobird.me> at 2023/05/08 23:41:11 created.
 */

import React from "react";
import { connect } from "react-redux";
import { IStoreState } from "../../store/reducers";
import { User } from "../../store/reducers/app";
import { bindActionCreators } from "redux";

import * as actionCreator from "../../store/actions/app";

type IReduxProps = {
  user?: User;
} & typeof actionCreator;

type IReduxState = {
  user?: User;
};

class ReduxSample extends React.PureComponent<IReduxProps, IReduxState> {
  componentDidMount() {
    console.log(this);
  }

  componentDidUpdate(prevProps: Readonly<IReduxProps>, prevState: Readonly<IReduxState>, snapshot?: any): void {
    console.log('prevProps', prevProps);
    console.log('prevState', prevState);
    console.log('snapshot', snapshot);
  }

  render() {
    const { setUser } = this.props;
    return (
      <div className="redux">
        <h2>Redux</h2>
        <p>用户名：{this.props.user?.name}</p>
        <button
          onClick={() => {
            setUser({ name: "Redux" });
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

export default connect(mapStateToProps, mapDispatchToProps)(ReduxSample);
