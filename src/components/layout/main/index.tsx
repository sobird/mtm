/**
 * 商家后台SPA Layout
 * 
 * sobird<i@sobird.me> at 2023/09/06 16:47:45 created.
 */
import classNames from 'classnames';
import Header from './header';

export default function LayoutMain() {
  return (
    <div 
      className={classNames('app-container', {
        mounted: true,
      })}
    >
      <Header />
    </div>
  )
}