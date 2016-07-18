var defer = require('config/defer').deferConfig;

module.exports = {

  appName: defer(function (cfg) { return process.env.npm_package_config_appName+"-test" }),

}
