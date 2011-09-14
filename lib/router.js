var path = require('path')
  , defroutes = {}
var router = module.exports = function(app){
  if (!(this instanceof router)) return new router(app);
  this.app = app;
  this.loaded = [];
}
router._method = function(type) {
  return function(route, cPath){
    this._saveRoute(cPath, route)
    this.app[type](route, this._endpoint(cPath));
    return this;
  }
}
router.prototype.get = router._method('get');
router.prototype.post = router._method('post');
router.prototype.put = router._method('put');
router.prototype.delete = router._method('delete');

router.prototype._load = function(file){
  var controller = require(path.join('../controllers', file))
  if (this.loaded.indexOf(file) === -1) {
    this.loaded.push(file);
    this._applyParam(controller.param);
  }
  return controller;
}
router.prototype._applyParam = function(param){
  var app = this.app;
  param = param || {};
  Object.keys(param).forEach(function(k){
    app.param(k, param[k]);
  })
}
router.prototype._saveRoute = function(cPath, route) {
  defroutes[cPath] = defroutes[cPath] || []
  defroutes[cPath].push(route);
  return route;
}
router.prototype._endpoint = function(cPath) {
  var ref = cPath.split('.')
    , controller = ref[0]
    , method = ref[1]
  return this._load(controller)[method];
}

router.reverse = function(cPath, params){
  var route = (defroutes[cPath] || [])[0]
  if (!route) throw new Error('Controller "'+ cPath +'" is not bound to a route')
  Object.keys((params || {})).forEach(function(key){
    route = route.replace(':' + key, params[key]);
  })
  return route
}