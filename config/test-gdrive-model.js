var defer = require('config/defer').deferConfig;

module.exports = {

  appName: defer(function (cfg) { return process.env.npm_package_config_appName+"-test" }),

  auth: {
    scopes: ["https://www.googleapis.com/auth/drive.file", "https://www.googleapis.com/auth/drive.metadata"]
  }

}
