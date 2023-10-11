// todo
import { throttle } from 'lodash';
import isinView from './inview';

if (!window.$tracker) {
  window.console.error('未检测到灵犀类库，请检查页面配置！');
}

interface IValLab {
  poiId?: string;
  custom?: any;
}

interface IEnvironment {
  ct?: string;
  app?: number | undefined;
}

type LXReportPageTracker = (eventType: string, bid: string, val?: object, opts?: object) => void;

class Report {
  private readonly valLab: IValLab;

  private readonly environment: {};

  private $pageTracker: LXReportPageTracker;

  constructor(globalVal: IValLab, globalEnvironment = {}) {
    this.valLab = globalVal;
    this.environment = globalEnvironment;
  }

  static catchException(e: any, name: string) {
    window.console.warn(name, ' - catchException - ', e);
  }

  extendValLab(valLabCustom: any, valLabs?: any): IValLab {
    const valLab = { ...this.valLab, ...(valLabs || {}) };
    // 如果没有poi_id， 从全局拿
    if (!valLab.poi_id) {
      valLab.poi_id = window?.$thh?.poi_id || '';
    }
    valLab.custom = { ...valLab.custom, ...valLabCustom };
    return valLab;
  }

  extendEnv(environmentEnv: IEnvironment) {
    return { ...this.environment, ...environmentEnv };
  }

  pv(cid: string, valLabCustom?: {}, environmentPram?: any) {
    if (!cid) {
      window.console.error('pageView 未填写 cid');
    }
    try {
      const valLabs = {};
      if (valLabCustom?.poi_id) {
        valLabs.poi_id = valLabCustom.poi_id;
      }
      window.$pageTracker = window.$tracker(
        'pageView',
        this.extendValLab(valLabCustom, valLabs),
        this.extendEnv(environmentPram),
        cid,
      );
    } catch (e) {
      Report.catchException(e, 'pageView');
    }
  }

  mc(bid: string, valLabCustom?: {}, jumpClick?: boolean, options?: {}) {
    if (!bid) {
      console.error('moduleClick 未填写 bid');
      return;
    }
    try {
      // window.$pageTracker('moduleClick', bid, this.extendValLab(valLabCustom), options);
    } catch (e) {
      Report.catchException(e, 'moduleClick');
    }
  }

  mv(bid: string, valLabCustom?: {}, options?: {}) {
    if (!bid) {
      console.error('moduleView 未填写 bid');
      return;
    }
    try {
      // window.$pageTracker('moduleView', bid, this.extendValLab(valLabCustom), options);
    } catch (e) {
      Report.catchException(e, 'moduleView');
    }
  }

  me(bid: string, valLabCustom?: {}) {
    if (!bid) {
      console.error('moduleEdit 未填写 bid');
      return;
    }
    try {
      // window.$pageTracker('moduleEdit', bid, this.extendValLab(valLabCustom));
    } catch (e) {
      Report.catchException(e, 'moduleEdit');
    }
  }

  mvScroll(bid: string, valLabCustom: Object, ele: HTMLElement) {
    const self = this;
    const mvTrigger = () => {
      if (isinView(ele, null, true)) {
        if (!ele.getAttribute('lx-mv')) {
          // window.$pageTracker('moduleView', bid, self.extendValLab(valLabCustom));
        }
        ele.setAttribute('lx-mv', 'reported');
      }
    };
    mvTrigger();
    window.addEventListener('scroll', throttle(mvTrigger, 500));
  }

  pd(duration: any) {
    let valLabCustom: any = {};
    const toTypeString = Object.prototype.toString.call(duration);
    if (toTypeString === '[object Number]') {
      valLabCustom.duration = duration;
    } else if (toTypeString === '[object Object]') {
      if (!duration.duration) {
        window.console.error('未填写页面停留时间 duration ');
        return;
      } else {
        valLabCustom = duration;
      }
    } else {
      window.console.error('未填写页面停留时间格式不正确，应为 number 或 object ');
    }
    try {
      /* eslint-disable */
      window.$tracker('pageDisappear', this.extendValLab(valLabCustom));
    } catch (e) {
      Report.catchException(e, 'pageDisappear');
    }
  }
}

const getValLab = (): IValLab => {
  if (window?.$thh?.poi_id) {
    return {
      poi_id: window.$thh.poi_id,
    };
  }
  return {};
};

const environmentGlobal: IEnvironment = {};
export { Report, getValLab };
export default new Report(getValLab(), environmentGlobal);
