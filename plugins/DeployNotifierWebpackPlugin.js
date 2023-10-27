const HtmlWebpackPlugin = require('html-webpack-plugin');

const insert = (html, parent, content) => {
  const tag = `</${parent}>`;
  const tagIndex = html.indexOf(tag);

  return [html.slice(0, tagIndex), content, html.slice(tagIndex)].join('');
};

class DeployNotifierWebpackPlugin {
  constructor(config = {}) {
    this.config = Object.assign({
      appId: `${process.env?.APP_ID || ''}`,
      version: `${process.env?.FLOW_ID || ''}`,
      sha: `${process.env?.SHA || ''}`,
      deployTime: Date.now(),
      retryTimes: 2,
      notifyInterval: 5 * 60 * 1000,
      checkInterval: 5 * 60 * 1000,
      forceUpdateInterval: 60 * 1000,
      forceUpdate: false,
      server: ''
    }, config);
    this.filter = config.filter || (name => name === 'index.html');
    if (!this.config.appId || !this.config.template) {
      if (process.env.NODE_ENV === 'production' || config.strict !== false ) {
        // throw new TypeError('appId or template can not be empty!');
      }
    }
  }

  addAssets (
    content,
    htmlPluginData,
    parent
  ) {
    htmlPluginData.html = insert(htmlPluginData.html, parent, content);
  }

  apply(compiler) {
    // 构建完成钩子
    compiler.hooks.done.tapAsync("DeployNotifierWebpackPlugin", (stats, callback) => {
      const { output } = stats.compilation.options;
      compiler.outputFileSystem.writeFile(`${output.path}/version.json`, JSON.stringify(this.config), callback);
    })
    compiler.hooks.compilation.tap(
      'DeployNotifierWebpackPlugin',
      compilation => {
        const hooks = HtmlWebpackPlugin.getHooks(compilation);

        hooks.beforeEmit.tap('DeployNotifierWebpackPlugin', htmlPluginData => {
          if (this.filter(htmlPluginData.plugin.options.filename)) {
            this.addAssets(`<link rel="stylesheet" href="//awp-assets.meituan.net/set/thh_tfe_deploy_notifier/notifier.css" />`, htmlPluginData, 'head');
            this.addAssets(`<script>window.config = ${JSON.stringify(this.config)}</script><script defer src="//awp-assets.meituan.net/set/thh_tfe_deploy_notifier/notifier.js?v=${this.config.version || Date.now()}"></script>`, htmlPluginData, 'body');
          }

          return htmlPluginData;
        });
      }
    );
  }
}

module.exports = DeployNotifierWebpackPlugin;
module.exports.DeployNotifierWebpackPlugin = DeployNotifierWebpackPlugin;
