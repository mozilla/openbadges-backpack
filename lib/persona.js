var _ = require('underscore');
var expressPersona = require('express-persona');

var ORIGIN = "https://login.persona.org";
var JS_URL = ORIGIN + "/include.js";

exports.ORIGIN = ORIGIN;
exports.JS_URL = JS_URL;

exports.express = function(app, options) {
  var defineRoutes = options.defineRoutes || require('express-persona');

  _.extend(app.locals, {PERSONA_JS_URL: options.jsUrl || JS_URL});
  defineRoutes(app, {audience: options.audience});
};
