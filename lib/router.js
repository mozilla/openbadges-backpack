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
router.method = function(type) {
  return function(path, cont){ this.app[type](__path(cont, path), __controller(cont)); return this; }
}
router.prototype.get = router.method('get');
router.prototype.post = router.method('post');
router.prototype.put = router.method('put');
router.prototype.delete = router.method('delete');


router.reverse = function(){}

