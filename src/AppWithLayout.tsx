/**
 * App带布局
 *
 * sobird<i@sobird.me> at 2021/07/02 15:08:14 created.
 */

import { Route, Switch } from 'react-router-dom';

import Layout from '@/components/layout';
import Home from '@/pages/home';
import App from './App';

export default function AppWithLayout () {
  return (
    <>
      <Switch>
        <Route path="/home" component={Home} />

        <Route
          path="/"
          component={() => (
            <Layout>
              <App />
            </Layout>
          )}
        />
      </Switch>
      <div
        className="mt-watermark"
        style={{
          backgroundImage: 'url(/api-wm/image/visible?deg=-20&type=4)',
          backgroundSize: '330px, auto',
          position: 'fixed',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          zIndex: 999999,
          pointerEvents: 'none',
        }}
      />
    </>
  );
}
