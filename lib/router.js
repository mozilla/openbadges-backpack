var defroutes = {};

var __controller = function(cPath) {
  var ref = cPath.split('.');
  return require('../controllers/' + ref[0])[ref[1]];
}

var __path = function(controller, path) {
  defroutes[controller] = defroutes[controller] || []
  defroutes[controller].push(path);
  return path;
}

var router = module.exports = function(app){
  if (!(this instanceof router)) return new router(app);
  this.app = app;
}
router._method = function(type) {
  return function(path, cont){ this.app[type](__path(cont, path), __controller(cont)); return this; }
}
router.prototype.get = router._method('get');
router.prototype.post = router._method('post');
router.prototype.put = router._method('put');
router.prototype.delete = router._method('delete');

router.reverse = function(controller, obj){
  var route = (defroutes[controller] || [])[0]
  Object.keys((obj || {})).forEach(function(key){
    route = route.replace(':' + key, obj[key]);
  })
  return route
}