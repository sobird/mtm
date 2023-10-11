import { throttle } from 'lodash';
import report from './index';
import isinView from './inview';

// 声明式上报基础方法
function reportByEle(type: 'pv' | 'mc' | 'mv' | 'me', ele: HTMLElement) {
  if (!ele) return;
  const datasetType = type.charAt(0).toUpperCase() + type.slice(1);
  const datasetVal = ele.dataset[`lx${datasetType}`];
  if (datasetVal) {
    try {
      const data = JSON.parse(datasetVal);
      report[type](data.bid, data.custom);
      // eslint-disable-next-line
    } catch (e) {
      report[type](datasetVal);
    }
  }
}

// 批量判断dom元素是否展示在窗口中
function viewAnalytic(domList: NodeListOf<Element>, cb: any, timing = 0) {
  setTimeout(() => {
    if (domList.length === 0) {
      return;
    }
    const domListArr = Array.from(domList);
    domListArr.forEach(ele => {
      if (isinView(ele)) {
        cb(ele);
      }
    });
  }, timing);
}

// 声明式上报mc事件
export function mcAuto() {
  const handleClick = (e: Event) => {
    const targetEle = e.target as HTMLElement;
    let sourceEle: HTMLElement | null = targetEle;
    // 事件会顺着target向上寻找到第一个有data-lx-mc标识的父元素去曝光
    while (sourceEle && !sourceEle.hasAttribute('data-lx-mc')) {
      sourceEle = sourceEle.parentElement;
    }
    if (sourceEle) {
      reportByEle('mc', sourceEle);
    }
  };
  // 当页面渲染完成后对mc事件进行监听
  document.addEventListener('click', handleClick);
  return handleClick;
}

// 声明式上报pv事件
export function pvAuto() {
  // 当页面渲染完成后需要触发一次pv
  const pvEle = document.querySelector('[data-lx-pv]') as HTMLElement;
  reportByEle('pv', pvEle);
}

// 手动触发声明式上报mv事件
export function triggerMvAuto() {
  const mvEle = document.querySelectorAll('[data-lx-mv]');
  viewAnalytic(mvEle, (ele: any) => {
    // 发送mv事件
    reportByEle('mv', ele as HTMLElement);
    ele.removeAttribute('data-lx-mv');
  });
}

// 声明式上报mv事件
export function mvAuto() {
  const handleScroll = throttle(triggerMvAuto, 500);
  // 当页面渲染完后对mv事件进行监听
  window.addEventListener('scroll', handleScroll);
  return handleScroll;
}

// 手动上报pv事件
export function pv(cid: string, data?: Object) {
  report.pv(cid, data);
}

// 手动上报mc事件
export function mc(bid: string, data?: Object, jumpClick?: boolean, options?: {}) {
  report.mc(bid, data, jumpClick, options);
}

// 手动上报mv事件
export function mv(bid: string, data?: Object, options?: {}) {
  report.mv(bid, data, options);
}

// 手动上报me事件
export function me(bid: string, data?: Object) {
  report.me(bid, data);
}

// 手动上报mv事件，并且添加scroll检测
export function mvScroll(bid: string, data: Object, ele: HTMLElement) {
  function mvTrigger() {
    if (isinView(ele)) {
      if (!ele.getAttribute('lx-mv')) {
        report.mv(bid, data);
      }
      ele.setAttribute('lx-mv', 'reported');
    }
  }
  mvTrigger();
  window.addEventListener('scroll', throttle(mvTrigger, 500));
}

export default report;
