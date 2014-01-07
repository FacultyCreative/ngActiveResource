//Manage notification center in osx
//Based on https://npmjs.org/package/node-osx-notifier
//Configuration sample:
// osxNotifications = {
//   notify: true,
//   host: "localhost",  //Defaults to localhost
//   port: 1337 //defaults to 1337
// };
var util = require('util');
var spawn = require('child_process').spawn;
var path = require('path');
var http = require('http');
var root = __dirname;
var osxNotifier = {};

var config_osx = {
  host: "localhost",
  port: 1337
}

var OSXReporter = function(helper, logger) {
  var log = logger.create('reporter.osx');

  // Start local server that will send messages to Notification Center
  var center = spawn(path.join(root, "/node_modules/node-osx-notifier/lib/node-osx-notifier.js"), [config_osx.port, config_osx.host]);
  log.info("OSX Notification Center reporter started at http://%s:%s", config_osx.host, config_osx.port);
  center.on('exit', function(code) {
      log.info('node-osx-notifier exited with code ' + code);
  });

  this.adapters = [];

  this.onBrowserComplete = function(browser) {
    var results = browser.lastResult;
    var time = helper.formatTimeInterval(results.totalTime);

    var str_request = null,
        title = null,
        message = null;
    
    if (results.disconnected || results.error) {
      str_request = 'fail';
      title = util.format('ERROR - %s', browser.name);
      message = 'Test error';
    }
    else if (results.failed) {
      str_request = 'fail';
      title = util.format('FAILED - %s', browser.name);
      message = util.format('%d/%d tests failed in %s.', results.failed, results.total, time);
    }
    else {
      str_request = 'pass';
      title = util.format('PASSED - %s', browser.name);
      message = util.format('%d tests passed in %s.', results.success, time);
    }

    var uri = '/' + str_request + "?title=" + encodeURIComponent(title) + "&message=" + encodeURIComponent(message);
    var options = {
      host: config_osx.host,
      port: config_osx.port,
      path: uri,
      method: 'GET'
    };

    log.debug("Sending request to osx notification center.");

    var req = http.request(options, null);

    req.on('error', function(err) {
      log.error('error: ' + err.message);
    });
    
    req.end();
  };

  this.onRunComplete = function(browsers, results) {
    if (browsers.length > 1 && !results.disconnected) {
      var str_request = null,
          title = null,
          message = null;

      if (!results.failed && !results.error) {
        str_request = 'pass';
        title = util.format('TOTAL PASSED: %s', results.success);
        message = util.format('All %d tests passed.', results.success);
      } else {
        str_request = 'fail';
        title = util.format('TOTAL FAILED: %s', results.success);
        message = util.format('%d/%d tests failed.', results.failed, results.failed+results.success);
      }

      var uri = '/' + str_request + "?title=" + encodeURIComponent(title) + "&message=" + encodeURIComponent(message);
      var options = {
        host: config_osx.host,
        port: config_osx.port,
        path: uri,
        method: 'GET'
      };
      var req = http.request(options, null);
      req.on('error', function(err) {
        log.error('error: ' + err.message);
      });    
      req.end();
    }
  };
};

if (process.platform !== 'darwin') {
  // overwrite reporter with void function for non-OSX
  OSXReporter = function(helper, logger) {}
}

OSXReporter.$inject = ['helper', 'logger'];

// PUBLISH DI MODULE
module.exports = {
  'reporter:osx': ['type', OSXReporter]
};
