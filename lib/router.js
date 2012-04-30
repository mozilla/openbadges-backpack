// Helper library for path routing in express and allowing reverse path
// lookup. See ../app.js for example of its usage
//
// This is currently written in such a way that it cannot be easily included
// in more than one app where the paths might overlap. `defroutes` is used to
// do the reverse lookup and it's set at a global level, rather than
// per-router instance.
var path = require('path');
var defroutes = {};

var router = module.exports = function (app) {
  if (!(this instanceof router)) return new router(app);
  this.app = app;
  this.loaded = [];
};

// Generator for creating router methods.
// Router methods take a route and a controller path in the format
// `filename`.`methodname`. Currently the controllers must live in
// <app_root>/controllers
router._method = function (type) {
  return function (route, cPath) {
    this._saveRoute(cPath, route);
    this.app[type](route, this._endpoint(cPath));
    return this;
  };
};

router.prototype['get'] = router._method('get');
router.prototype['post'] = router._method('post');
router.prototype['put'] = router._method('put');
router.prototype['delete'] = router._method('delete');

// Finds an endpoint (method to handle a path) from a controller path
// (filename.methodname). See router.prototype._load
router.prototype._endpoint = function (cPath) {
  var ref = cPath.split('.');
  var controller = ref[0];
  var method = ref[1];
  return this._load(controller)[method];
};

// Loads a controller file and checks to see if any params need to be
// registered, registers them with router.prototype._applyParam
router.prototype._load = function (file) {
  var controller = require(path.join('../controllers', file));
  if (this.loaded.indexOf(file) === -1) {
    this.loaded.push(file);
    this._applyParam(controller.param);
  }
  return controller;
};

// Checks the controller file for an exports.param object, applies all of the
// param preprocessors it finds to the app. See docs for express for more
// information on param preprocessing.
router.prototype._applyParam = function (param) {
  var app = this.app;
  param = param || {};
  Object.keys(param).forEach(function (k) {
    app.param(k, param[k]);
  });
};

// Saves the route to the (global) defroutes object so we can lookup later.
router.prototype._saveRoute = function (cPath, route) {
  defroutes[cPath] = defroutes[cPath] || [];
  defroutes[cPath].push(route);
  return route;
};

// Look up a route from the defroutes table. Can also take a hash of
// parameters and values to substitute in the route if necessary.
router.reverse = function (cPath, params) {
  //need to add the ability to break up cPath into params and then eval th params - not sure if that's a good
  //security thing to do though. - the params would be a json-able thing though, right?
  var route = (defroutes[cPath] || [])[0];
  if (!route) throw new Error('Controller "' + cPath + '" is not bound to a route');
  Object.keys((params || {})).forEach(function (key) {
    route = route.replace(':' + key, params[key]);
  });
  return route;
};