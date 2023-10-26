const HtmlWebpackPlugin = require('html-webpack-plugin');

const insert = (html, parent, content) => {
  const tag = `</${parent}>`;
  const tagIndex = html.indexOf(tag);

  return [html.slice(0, tagIndex), content, html.slice(tagIndex)].join('');
};

class DeployNotifierWebpackPlugin {
  constructor(config = {}) {
    this.notifierConfig = Object.assign({
      appId: `${process.env?.APP_ID || ''}`,
      version: `${process.env?.FLOW_ID || ''}`,
      sha: `${process.env?.SHA || ''}`,
      deployTime: Date.now(),
      retryTimes: 2,
      notifyInterval: 5 * 60 * 1000,
      checkInterval: 5 * 60 * 1000,
      forceUpdateInterval: 60 * 1000,
      forceUpdate: false,
      server: 'https://s3plus.meituan.net/v1/mss_03d0d9cf21144ba0b7747ba1dc1acf6e/upload-notifier'
    }, config);
    this.filter = config.filter || (name => name === 'index.html');
    if (!this.notifierConfig.appId || !this.notifierConfig.template) {
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
    compiler.hooks.compilation.tap(
      'DeployNotifierWebpackPlugin',
      compilation => {
        const hooks = HtmlWebpackPlugin.getHooks(compilation);

        hooks.beforeEmit.tap('DeployNotifierWebpackPlugin', htmlPluginData => {
          if (this.filter(htmlPluginData.plugin.options.filename)) {
            this.addAssets(`<link rel="stylesheet" href="//awp-assets.meituan.net/set/thh_tfe_deploy_notifier/notifier.css" />`, htmlPluginData, 'head');
            this.addAssets(`<script>window.notifierConfig = ${JSON.stringify(this.notifierConfig)}</script><script defer src="//awp-assets.meituan.net/set/thh_tfe_deploy_notifier/notifier.js?v=${this.notifierConfig.version || Date.now()}"></script>`, htmlPluginData, 'body');
          }

          return htmlPluginData;
        });
      }
    );
  }
}

module.exports = DeployNotifierWebpackPlugin;
module.exports.DeployNotifierWebpackPlugin = DeployNotifierWebpackPlugin;
