
/**
 * Perform a number of actions synchronously. Useful for doing animated DOM
 * manipulation.
 *
 * Example usage:
 *   $("#widget").sync(
 *     ['fadeOut', 1000],
 *     ['appendTo', $('#widgetContainer')]
 *     ['fadeIn', 'fast']
 *   );
 *     
 * @param {Array...} a list of method descriptions:
 *    [methodName, arg1, arg2, ..., argN]
 *    - methodName will be used to find the method on the jQuery object
 *    - the rest of the list will be applied to that method.
 */

$.fn.sync = function () {
  var self = this
    , fx = ['fadeIn', 'fadeOut', 'fadeTo', 'slideUp', 'slideDown', 'slideToggle', 'animate']
    , methodList = [].slice.call(arguments)
    , methods
  
  // turn a return-style method into a callback-style method.
  function callbackify (method, opts) {
    return function (callback) { 
      callback(null, method.apply(this, opts));
    }
  }
  
  // the strategy here is to partially apply all of the methods to a
  // new list of methods that all take one argument: a callback.
  methods = _.map(methodList, function (opts) {
    var name =  opts.shift()
      , method = self[name];

    if (_.include(fx, name)) {
      // this is super dumb and could be avoided if func.bind could take an
      // array of items to apply. instead we take the list of arguments
      // and reduce it, partially applying the next arg to the function created
      // by the last partial application.
      var memo = _.bind(method, self)
      function applier (fn, arg) { return _.bind(fn, null, arg); }
      return _.foldl(opts, applier, memo);
    }
    
    else {
      // if it's not a known async method assume it's return-style and make it
      // callback-style. we don't have to deal with partial application in this
      // case since we are getting all the args upfront.
      return _.bind(callbackify(method, opts), self);
    }
  });
  
  // here's where the magic happens: `methods` comes out as a list of single-param
  // functions expecting a callback. we start with the last function and fold from
  // the right wrapping the `memo` in the next function. we get this in the end:
  //   [fn1, fn2, fn3,...,fnN] -> fn1(fn2(fn3(...(fnN))))
  // this is different than composition: we creating a new function by applying the
  // next function to the memo'd function as opposed to using the next function's
  // return value.
  (_.foldr(methods, _.wrap, methods.pop()))();
  return this;
}
