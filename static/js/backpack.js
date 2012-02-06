var CSRF = $("input[name='_csrf']").val();

(function initialize($){
  // For yet to be logged in users, bind signin button. Depends on
  // navigator.id.getVerifiedEmail, which is currently provided by
  // https://browserid.org/include.js
  function browserId() {
    function launchBrowserId(callback) {
      return function() { navigator.id.getVerifiedEmail(callback); }
    }
    function handleResponse(assertion) {
      if (!assertion) return false;
      $('.js-browserid-input').val(assertion);
      $('.js-browserid-form').trigger('submit');
    }
    $('.js-browserid-link').bind('click', launchBrowserId(handleResponse));
  }
  
  function draggables() {
    $('[draggable=true]').live('dragstart', function (jqEvent) {
      var event = jqEvent.originalEvent;
      event.dataTransfer.setData('Text', this.id);
    });
  }
  
  function groupInputs() {
    var focus = function () {
      var $el = $(this);
      $el.data('previously', $el.val())
    }

    var blur = function () {
      var $el = $(this)
        , $group = $el.closest('.group');
      if ($el.val() === $el.data('previously')) return;
      updateGroup($group);
    }
    
    var keyup = function (event) {
      var $el = $(this);
      switch (event.keyCode) {
       case 13:
        $el.trigger('blur');
        break;
        
       case 27:
        $el.val($el.data('previously'));
        $el.trigger('blur');
        break;
      }
    }
    
    $('.group input')
      .live('focus', focus)
      .live('blur', blur)
      .live('keyup', keyup);
  }
  
  groupInputs();
  draggables();
  browserId();
})(jQuery);

function removeFromGroup($group, id, callback) {
  callback = callback || function(){}
  var badges = [];
  $group.data('badges').forEach(function (bid) {
    if (bid === id) return;
    badges.push(bid);
  });
  $group.data('badges', badges);
  updateGroup($group);
}

function addToGroup($group, id, callback) {
  callback = callback || function(){}
  var badges = $group.data('badges');
  badges.push(id);
  updateGroup($group);
}

function createGroup($group, callback) {
  callback = callback || function(){};
  jQuery.post("/collection", {
    _csrf: CSRF,
    badges: $group.data('badges'),
    name: 'New Group'
  }, callback)
}

function updateGroup($group, callback) {
  callback = callback || function(){};
  jQuery.post("/collection", {
    _method: 'put',    
    _csrf: CSRF,
    id: $group.data('id'),
    badges: $group.data('badges'),
    name: $group.find('input').val()
  }, callback)
}

function cancel (event) {
  if (event.preventDefault) event.preventDefault();
  return false;
}
function enterFn() { $(this).addClass('hovering'); }
function leaveFn() { $(this).removeClass('hovering'); }
function dropFn(jqEvent) {
  var event = jqEvent.originalEvent
    , id = event.dataTransfer.getData('Text')
    , $group = $(this)
    , $parent = $group.parent()
    , $original = $('#' + id)
    , height = $original.height()
    , width = $original.width()
    , $badge = $original
    , $exists = $group.find('[id|=' + $original.data('hash') + ']')
  
  if (event.preventDefault) event.preventDefault();
  
  if (event.stopPropagation) event.stopPropagation();
  
  $group.removeClass('hovering');
  
  if ($exists.length) {
    $exists
      .animate({opacity: 0})
      .animate({opacity: 1})
    return;
  }
  
  if ($group.hasClass('new')) {
    var $newDropTarget = $group.clone()
    
    $group.data('badges', [$badge.data('id')]);

    createGroup($group, function (data) {
      $group.data('url', data['url']);
      $group.data('id', data['id']);
      $group.data('badges', [$badge.data('id')]);
    });
    
    $group.find('h3')
      .css({opacity: 0.9})
      .animate({opacity: 0})
      .animate({height: '10px'})
    
    $newDropTarget
      .hide()
      .appendTo($parent)
      .fadeIn()
    
    setupForDragging($newDropTarget);
    
    $group.removeClass('new');
    
    setTimeout(function () {
      
      $group.find('input').fadeIn()
      
      setTimeout(function () {
        $group.find('input').addClass('hover');
      }, 1000)

      setTimeout(function () {
        $group.find('input').removeClass('hover');
      }, 4000);
      
    }, 50);
  } else {
    addToGroup($group, $badge.data('id'));
  }
  
  var addBadge = function () {
    $group.append($badge);
    $badge
      .animate({height: height, width: width})
      .animate({opacity: 1})
  }
  
  if ($original.data('grouped')) {
    removeFromGroup($original.closest('.group'), $original.data('id'));
    $badge = $original;
    $badge
      .animate({opacity: 0})
      .animate({height: 0, width: 0}, null, addBadge);
  }
  
  else {
    $badge = $original.clone();
    $badge
      .data('grouped', true)
      .attr('id', $badge.attr('id')+'-'+Date.now())
      .css({opacity: 0, height: 0, width: 0})
    addBadge();

    console.dir($original.data('grouped'));
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
      , $badge = $('#' + event.dataTransfer.getData('Text'))
      , $group = $badge.closest('.group')
      , badges = $group.data('badges');
    if (event.preventDefault) event.preventDefault();
    
    if ($group.length) removeFromGroup($group, $badge.data('id'));
    
    $badge
      .animate({opacity: 0})
      .animate({width: 0, height: 0}, null, function () {
        $badge.remove();
      })
  })

