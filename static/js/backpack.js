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
function enterFn() { $(this).addClass('hovering'); }
function leaveFn() { $(this).removeClass('hovering'); }
function dropFn(jqEvent) {
  var event = jqEvent.originalEvent
    , id = event.dataTransfer.getData('Text')
    , $el = $(this)
    , $parent = $el.parent()
    , $original = $('#' + id)
    , height = $original.height()
    , width = $original.width()
    , $badge = null
    , $exists = $el.find('[id|=' + $original.data('hash') + ']')
  
  if (event.preventDefault) event.preventDefault();
  
  if (event.stopPropagation) event.stopPropagation();
  
  $el.removeClass('hovering');
  
  if ($exists.length) {
    $exists
      .animate({opacity: 0})
      .animate({opacity: 1})
    return;
  }
  
  if ($el.hasClass('new')) {
    var $new = $el.clone()
    
    $el.find('h3')
      .css({opacity: 0.9})
      .animate({opacity: 0})
      .animate({height: '10px'})
    
    $new
      .hide()
      .appendTo($parent)
      .fadeIn()
    
    setupForDragging($new);
    
    $el.removeClass('new');
    
    setTimeout(function () {
      
      $el.find('input').fadeIn()
      
      setTimeout(function () {
        $el.find('input').addClass('hover');
      }, 1000)

      setTimeout(function () {
        $el.find('input').removeClass('hover');
      }, 4000);
      
    }, 50);
  }
  
  var addBadge = function () {
    $el.append($badge);
    $badge
      .animate({height: height, width: width})
      .animate({opacity: 1})
  }
  
  if ($original.data('fromGroup')) {
    $badge = $original;
    $badge
      .animate({opacity: 0})
      .animate({height: 0, width: 0}, null, addBadge);

  } else {
    $badge = $original.clone();
    $badge
      .data('fromGroup', true)
      .attr('id', $badge.attr('id')+'-'+Date.now())
      .css({opacity: 0, height: 0, width: 0})
    addBadge();
  }
  
  return false;
}

function setupForDragging(element) {
  $(element)
    .bind('dragover', cancel)
    .bind('dragenter', enterFn)
    .bind('dragleave', leaveFn)
    .bind('drop', dropFn);
}

setupForDragging($('.group'));

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
