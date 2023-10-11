// todo 
export class Metrics {
  report(key: string, value: number, tags?: { [propName: string]: string | number }, extraMessage?: string) {
    // 2. 执行 Owl.MetricManager 方法，每次执行都会创建新的 MetricManager 实例，需要将 Owl 实例的配置 cfgManager 作为参数传入
    // const metric = Owl.MetricManager(Owl.cfgManager);
    const metric = window.Owl.metricManager;
    metric.setMetric(key, value);
    if (tags) {
      metric.setTags(tags);
    }
    if (extraMessage) {
      metric.setExtraData(extraMessage);
    }
    metric.report();
  }

  pv(pageUrl = window.location.href, aliasName?: string) {
    return this.report('pv', 1, {
      pageUrl,
      page: aliasName || pageUrl,
      version: '1.0.0',
    });
  }

  business(name: string, type: string, success: boolean, level?: 'major' | 'default') {
    return this.report('business', success ? 0 : 1, {
      name,
      type,
      level: level || 'default',
    });
  }

  api(path: string, type: string, success: boolean, code: number, level?: 'major' | 'default') {
    return this.report('api', success ? 0 : 1, {
      path,
      type,
      code,
      level: level || 'default',
    });
  }

  /**
   * 业务事件埋点，用于统计类似灵犀的场景需求
   * @param {string} name 事件名称 event_{module}_{...paths}_{name}
   * @param {string} type 目前仅支持 mc, mv，总体类型 5种
   * @param {string} group 备用字段，需要做二级聚合场景下使用，简单业务一般不需要使用！！！
   * @return {void}
   */
  analysis(name: string, type: 'mc' | 'mv' | string, group?: string) {
    const tags = { name, type };
    if (group !== '') {
      (
        tags as {
          name: string;
          type: string;
          group?: string;
        }
      ).group = group;
    }
    return this.report('analysis', 1, tags);
  }
}

export default new Metrics();
