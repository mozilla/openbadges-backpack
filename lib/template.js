var _ = require('underscore');
var nunjucks = require('nunjucks');
var flash = require('connect-flash');

var paths = require('./paths');

function flashList(req) {
  var flash = req.flash();
  var messages = [];
  Object.keys(flash).forEach(function(category) {
    messages.push.apply(messages, flash[category].map(function(html) {
      return {category: category, html: html};
    }));
  });
  return messages;
}

exports.express = function(app, options) {
  var loaders = [
    new nunjucks.FileSystemLoader(paths.templateDir)
  ].concat(options.extraTemplateLoaders || []);
  var nunjucksEnv = new nunjucks.Environment(loaders, {
    autoescape: true
  });

  _.extend(app.locals, {
    DOT_MIN: options.debug ? '' : '.min'
  });
  app.use(flash());
  nunjucksEnv.express(app);
  app.use(function setResponseLocals(req, res, next) {
    res.locals.csrfToken = req.session._csrf;
    res.locals.email = req.session.email || '';
    res.locals.fetchAndClearFlashMessages = flashList.bind(null, req);
    next();
  });
};
