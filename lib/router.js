var defroutes = {};

var __endpoint = function(cPath) {
  var ref = cPath.split('.')
    , controller = ref[0]
    , method = ref[1]
  return require('../controllers/' + controller)[method];
}
var __route = function(cPath, route) {
  defroutes[cPath] = defroutes[cPath] || []
  defroutes[cPath].push(route);
  return route;
}
var router = module.exports = function(app){
  if (!(this instanceof router)) return new router(app);
  this.app = app;
}
router._method = function(type) {
  return function(route, cPath){ this.app[type](__route(cPath, route), __endpoint(cPath)); return this; }
}
router.prototype.get = router._method('get');
router.prototype.post = router._method('post');
router.prototype.put = router._method('put');
router.prototype.delete = router._method('delete');

router.reverse = function(cPath, params){
  var route = (defroutes[cPath] || [])[0]
  if (!route) throw new Error('Controller "'+ cPath +'" is not bound to a route')
  Object.keys((params || {})).forEach(function(key){
    route = route.replace(':' + key, params[key]);
  })
  return route
}