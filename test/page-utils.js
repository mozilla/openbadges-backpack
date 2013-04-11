const cheerio = require('cheerio');
const server = require('../app');
const Badge = require('../models/badge');

/* Sort of mimic response.render, but grabs app.render from 
   the http.Server object. 
   Seems dumb, but I don't know how else to do it.
*/
exports.render = function render(view, options, fn) {
  var app = server._events.request;

  if ('function' == typeof options) {
    fn = options, options = {};
  }

  options._locals = app.locals;

  app.render(view, options, function(err, html) {
    var $ = cheerio.load(html);
    fn(err, $);
  });
};

exports.badgeList = function badgeList(length) {
  var list = [];
  while(length--) {
    list.push(new Badge());
  }
  return list;
};

exports.noBadgesPattern = /time to start earning/;

