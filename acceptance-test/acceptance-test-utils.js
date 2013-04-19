var soda = require('soda'),
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

soda.prototype.waitForVisibleContent = function(args) {
  var hasContent = exports.scriptify(function(window, args) {
    function collapseWhitespace(text) {
      return text.replace(/\n/g, ' ').replace(/\s+/g, ' ');
    }
    
    var element = window.document.querySelector(args.selector);
    var html = element && collapseWhitespace(element.innerHTML);
    if (!html)
      return false;
    return html.indexOf(collapseWhitespace(args.content)) != -1;
  }, args);

  return this.waitForVisible("css=" + args.selector)
             .waitForCondition(hasContent, 4000);
};

exports.scriptify = function(func, args) {
  var code = '(' + func.toString() + ')' +
             '(selenium.browserbot.getCurrentWindow(), ' +
             JSON.stringify(args) + ');';
  return code;
};

exports.createClient = function(options) {
  options = options || {};
  app.listen(parseInt(process.env['SELENIUM_APP_PORT'] || 8888));

  if (options.extensions)
    for (var name in options.extensions) {
      soda.prototype[name] = options.extensions[name];
    }

  var browser = soda.createClient({
      host: process.env['SELENIUM_HOST'] || '127.0.0.1'
    , port: parseInt(process.env['SELENIUM_PORT'] || 4444)
    , url: process.env['SELENIUM_APP_URL'] || 'http://127.0.0.1:8888/'
    , browser: process.env['SELENIUM_BROWSER'] || 'firefox'
  });
  
  browser.on('command', function(cmd, args){
    console.log(' \x1b[33m%s\x1b[0m: %s', cmd, args.join(', '));
  });
  
  return browser;
};
