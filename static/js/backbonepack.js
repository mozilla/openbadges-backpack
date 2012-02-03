ich.refresh();


!!function initialize (){
/** begin scope **/

var Group = Backbone.Model.extend({
  defaults: {
    name: "New Group",
    badges: Array(),
    "public": false
  }
});

Group.prototype.on('change:name', function () {
  this.save();
})  

Group.fromElement = function (element) {
  var $el = $(element)
    , badgeElements = $el.find('.badge')
    , groupBadges = new Groups(_.map(badgeElements, Badge.fromElement))
  return new Group({
    id: $el.data('id'),
    name: $el.find('input').val(),
    badges: groupBadges
  });
}

var Groups = Backbone.Collection.extend({
  url: '/collection',
  model: Group
})
var AllGroups = new Groups();

var Badge = Backbone.Model.extend();
Badge.fromElement = function (element) {
  var $badge = $(element);
  return new Badge({
    id: $badge.data('id'),
    image: $badge.find('img').attr('src')
  })    
}

var Badges = Backbone.Collection.extend({
  url: '/badge',
  model: Badge
})

var GroupView = Backbone.View.extend({
  parent: $('#groups'),
  
  tagName: "div",
  
  className: "group",
  
  events: {
    'keyup input': 'checkDone',
    'focus input': 'storeCurrent',
    'blur input': 'maybeUpdate'
  },
  
  storeCurrent: function (event) {
    var $el = $(event.currentTarget);
    $el.data('previously', $el.val());
  },
  
  checkDone: function (event) {
    var $el = $(event.currentTarget);
    
    switch (event.keyCode) {
     case 13:
      $el.trigger('blur');
      break;
      
     case 27:
      $el.val($el.data('previously'));
      $el.trigger('blur');
      break;
    }
  },
  
  maybeUpdate: function (event) {
    var $el = $(event.currentTarget)
      , newName = $el.val()
      , oldName = $el.data('previously')
    
    if (newName === oldName)
      return;
    
    this.model.set({ name: newName });
  },
  
  render: function () {
    console.dir(this.model)
    this.el = ich.groupTpl(this.model.attributes);
    this.$el = $(this.el)
      .hide()
      .appendTo(this.parent)
      .fadeIn();
  }
});

var BadgeView = Backbone.View.extend({
  tagName: "a",
  
  className: "badge",
  
  render: function (where) {
    console.dir(this.model.attributes);
    this.el = ich.badgeTpl(this.model.attributes);
    this.$el = $(this.el)
      .hide()
      .appendTo(where)
      .fadeIn();
  }
});

/**
 * Create models from bootstrapped page and attach models to views.
 */

var existingGroups = $('#groups').find('.group');
existingGroups.each(function () {
  var model = Group.fromElement($(this));
  AllGroups.add(model);
  new GroupView({ model: model }).setElement($(this));
})

/**
 * Create badge models from bootstrapped page and attach models to views.
 */

var existingBadges = $('#badges').find('.badge')
existingBadges.each(function () {
  var model = Badge.fromElement($(this));
  new BadgeView({ model: model }).setElement($(this));
})





!!function browserId() {
  function launchBrowserId(callback) {
    return function() { navigator.id.getVerifiedEmail(callback); }
  }
  function handleResponse(assertion) {
    if (!assertion) return false;
    $('.js-browserid-input').val(assertion);
    $('.js-browserid-form').trigger('submit');
  }
  $('.js-browserid-link').bind('click', launchBrowserId(handleResponse));
}();

/*end scope*/
}()