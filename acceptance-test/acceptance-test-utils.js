var soda = require('soda'),
    config = require('./local-config').config,
    app = require('../app.js');

soda.prototype.gracefulExit = function() {
  return this.end(function(err) {
    this.testComplete(function() {
      if (err)
        throw err;
      console.log("Test successful.");
      // TODO: Why doesn't app.close() exit the process?
      process.exit(0);
    });
  });
};

exports.scriptify = function(func, args) {
  var code = '(' + func.toString() + ')' +
             '(selenium.browserbot.getCurrentWindow(), ' +
             JSON.stringify(args) + ');';
  return code;
};

exports.createClient = function() {
  app.listen(8888);

  var browser = soda.createClient({
      host: config.host
    , port: config.port || 4444
    , url: config.url || 'http://localhost:8888/'
    , browser: config.browser || 'firefox'
  });
  
  browser.on('command', function(cmd, args){
    console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
  });
  
  return browser;
};
