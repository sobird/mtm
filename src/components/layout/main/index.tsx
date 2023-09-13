/**
 * 商家后台SPA Layout
 * 
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import classNames from 'classnames';
import Header from './header';
import Aside from './aside';
import './index.scss';

export default function LayoutMain() {
  return (
    <>
      <div 
        className={classNames('app-container', {
          mounted: true,
        })}
      >
        <Header />
        <div className="app-body">
          <Aside />
          <main className="app-main">
            <div>123</div>
          </main>
        </div>
      </div>
      <div
        className="app-watermark"
        style={{
          backgroundImage: 'url(/image/visible?deg=-20&type=4)',
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
  )
}