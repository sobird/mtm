/**
 * check if element unveil
 * @param {object} html dom
 * @param {object} {IN_SCREEN_HEIGHT,IN_SCREEN_WIDTH}
 * @param {boolean} 是否只要露出一点就算展示
 * @return {boolean}
 */

export default (element: any, area?: any, switcher: boolean = true): boolean => {
  let IN_SCREEN_HEIGHT = 50;
  let IN_SCREEN_WIDTH = 50;

  if (area && Object.prototype.toString.call(area) === '[object Object]') {
    IN_SCREEN_WIDTH = Number.isFinite(area.width) ? +area.width : IN_SCREEN_WIDTH;
    IN_SCREEN_HEIGHT = Number.isFinite(area.height) ? +area.heigth : IN_SCREEN_HEIGHT;
  }

  const rect = element.getBoundingClientRect();
  const windowHeight = document.documentElement ? document.documentElement.clientHeight : 0;
  const windowWidth = document.documentElement ? document.documentElement.clientWidth : 0;

  const elementHeight = rect.height;
  const elementWidth = rect.width;

  const onScreenHeight = elementHeight || IN_SCREEN_HEIGHT;
  const onScreenWidth = elementWidth || IN_SCREEN_WIDTH;

  // 元素在屏幕上方
  const elementBottomToWindowTop = rect.bottom;
  const bottomBoundingOnScreen = elementBottomToWindowTop <= windowHeight;

  // 元素在屏幕下方
  // switcher为true表示只要元素露出1px就上报
  const showHeight = switcher ? 1 : onScreenHeight;
  const elementTopToWindowBottom = windowHeight - rect.top;
  const topBoundingOnScreen = elementTopToWindowBottom >= showHeight;

  // 元素在屏幕左侧
  const elementRightToWindowLeft = +rect.left + +elementWidth;
  const rightBoundingOnScreen = elementRightToWindowLeft >= onScreenWidth;

  // 元素在屏幕右侧
  const elementLeftToWindowRight = windowWidth - (rect.right - elementWidth);
  const leftBoundingOnScreen = elementLeftToWindowRight >= onScreenWidth;

  if (switcher && topBoundingOnScreen) {
    // 如果漏出任何一点就算出现
    return true;
  }

  if ((switcher || bottomBoundingOnScreen) && topBoundingOnScreen && rightBoundingOnScreen && leftBoundingOnScreen) {
    return true;
  }
  return false;
};
