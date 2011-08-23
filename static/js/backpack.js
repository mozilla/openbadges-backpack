(function($){
  // Used for indicating CSS classes are important for functionality, see
  // below.
  var __CLASS_PREFIX = 'js';
  
  // Build a limited selector based on a prefix and classname. The suffix will
  // usually be named after the thing being selected. Doing this helps
  // slightly with separation of concerns -- classes that begin with the
  // prefix indicate they are functional and should not be hooked or changed
  // for style.
  function __scopeTo(className) {
    return function(suffix){
      return $('.' + [__CLASS_PREFIX, className, suffix].join('-'));
    };
  }
  
  // For yet to be logged in users, bind signin button. Depends on
  // navigator.id.getVerifiedEmail, which is currently provided by
  // https://browserid.org/include.js
  function bindSignIn(className) {
    var $$ = __scopeTo(className);
    $$('link').bind('click', function(){
      navigator.id.getVerifiedEmail(function(assertion) {
        if (assertion) {
          $$('input').val(assertion);
          $$('form').trigger('submit');
        }
      });
    });
  }
  
  // For logged in users, activate dropdown on click.
  function bindUserMenu(className) {
    var $$ = __scopeTo(className);
    $$('link').bind('click', function(){ $$('dropdown').toggle(); });
  }

  bindSignIn('browserid');
  bindUserMenu('usermenu');
})(jQuery);