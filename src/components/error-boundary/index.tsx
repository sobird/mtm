/**
 * 错误边界
 *
 * sobird<i@sobird.me> at 2023/05/09 1:51:06 created.
 */

import React, { PropsWithChildren } from 'react';
import { Result, Button } from 'antd';

interface ErrorBoundaryProps {
  title?: React.ReactNode;
  onRetry?: () => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Captures which component contained the exception, and its ancestors.
 */
export interface ErrorInfo {
  componentStack: string;
}

const reloadPage = () => { return window.location.reload(); };

class ErrorBoundary extends React.Component<PropsWithChildren<ErrorBoundaryProps>, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error) {
    // 更新 state 使下一次渲染能够显示降级后的 UI
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // 将错误信息上报给服务器
    console.log(error, errorInfo);
  }

  private handleRetry = () => {
    const { onRetry } = this.props;
    this.setState({ error: null }, onRetry);
  };

  render(): React.ReactNode {
    const { error } = this.state;
    const { title, children } = this.props;

    if (error) {
      // 你可以自定义降级后的 UI 并渲染
      const errorMessage = error.message;

      return (
        <Result
          status="error"
          title={title}
          subTitle={(
            <>
              请稍后重试，无法恢复时请反馈给客服、运营同学
              {errorMessage && (
                <>
                  <br />
                  <span>{errorMessage}</span>
                </>
              )}
            </>
          )}
          extra={(
            <Button type="primary" onClick={this.handleRetry}>
              重试
            </Button>
          )}
        />
      );
    }

    return children;
  }
}

ErrorBoundary.defaultProps = {
  title: '应用出现异常',
  onRetry: reloadPage,
};

export default ErrorBoundary;
