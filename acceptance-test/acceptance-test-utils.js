var soda = require('soda'),
    config = require('./local-config').config,
    app = require('../app.js');

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
