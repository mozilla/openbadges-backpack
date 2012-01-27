// from http://allampersandall.blogspot.com/2011/12/hoganjs-expressjs-nodejs.html
var HoganExpressAdapter=(function(){
  var init=function(hogan) {
    var compile=function(source){
      return function(options) {
        return hogan.compile(source).render(options);
      };
    }
    return {compile:compile};
  };
  return {init:init};
}());

if(typeof module!== 'undefined' && module.exports){
  module.exports=HoganExpressAdapter;
} else if (typeof exports!=='undefined') {
  exports.HoganExpressAdapter=HoganExpressAdapter;
}