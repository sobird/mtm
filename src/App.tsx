import { Suspense } from "react";
import { Switch, useLocation } from 'react-router-dom';
import ErrorBoundary from "@/components/error-boundary";
import Guards from '@/router/guards';
import { routes } from './router';

import "./App.scss";

function App() {
  const { pathname } = useLocation();
  return (
    <div className="micro-view">
      <div className="micro-body">
        <ErrorBoundary>
          <Suspense fallback={<div>Loading</div>}>
            <Switch>
              <Guards routes={routes} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </div>

      <footer id="footer" className="footer">
        <p>
          Copyright&nbsp;©&nbsp;{new Date().getFullYear()}&nbsp; 美团电商{' '}
          {/* {process.env.config.NODE_ENV !== 'prod' && (
            <a href={`${pathname}${location.search}`} target="_blank">
              选品系统
            </a>
          )} */}
        </p>
      </footer>
    </div>
  );
}
export default App;
