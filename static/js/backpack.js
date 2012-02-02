(function($){
  // Used for indicating CSS classes are important for functionality, see
  // below.
  var __CLASS_PREFIX = 'js';
  
  $.fn.slideUpAndFadeOut = function(delay, fn) {
    return $(this).animate({
      opacity: 'hide',
      height: 'hide',
      marginTop: 'hide',
      marginBottom: 'hide',
      paddingTop: 'hide',
      paddingBottom: 'hide'
    }, delay, fn)
  };
  
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

  // Activate the close button on error boxes.
  function bindAlertClose(className) {
    var $$ = __scopeTo(className);
    $$('close').bind('click', function() {
      $$('container').slideUpAndFadeOut();
    })
  }
  
  bindSignIn('browserid');
  bindUserMenu('usermenu');
  bindAlertClose('alert');
})(jQuery);




$('[draggable=true]').live('dragstart', function (jqEvent) {
  var event = jqEvent.originalEvent;
  event.dataTransfer.setData('Text', this.id);
});


function cancel (event) {
  if (event.preventDefault) event.preventDefault();
  return false;
}

$('.newGroup')
  .live('dragover', cancel)
  
  .live('dragenter', function () {
    $(this).addClass('hovering');
  })
  
  .live('dragleave', function () {
    $(this).removeClass('hovering');
  })
  
  .live('drop', function (jqEvent) {
    var event = jqEvent.originalEvent
        , $el = $(this)
        , $original = $('#' + event.dataTransfer.getData('Text'))
        , $badge = $original.clone();
    if (event.preventDefault) event.preventDefault();
    
    $badge
      .data('fromGroup', true)
      .attr('id', $badge.attr('id')+'_'+Date.now())
      .css({opacity: 0, height: '0px', width: '0px'});
    
    $el.removeClass('hovering');
    $el.append(
      $badge
        .animate({height: $original.height(), width: $original.width()})
        .animate({opacity: 1})
    );
    return false;
  });

$('body')
  .bind('dragover', cancel)
  
  .bind('dragenter', cancel)
  
  .bind('drop', function (jqEvent) {
    var event = jqEvent.originalEvent
        , $badge = $('#' + event.dataTransfer.getData('Text'));
    
    if (event.preventDefault) event.preventDefault();
    
    if ($badge.data('fromGroup')) {
      $badge
        .animate({opacity: 0})
        .animate({width: 0, height: 0}, null, function () {
          $badge.remove();
        })
    }
  });
