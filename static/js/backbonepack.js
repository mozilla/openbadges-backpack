ich.refresh();

!function setup () {
/** begin setup **/

var CSRF = $("input[name='_csrf']").val();
$.ajaxSetup({
  beforeSend: function (xhr, settings) {
    if (settings.crossDomain)
      return; 
    if (settings.type == "GET")
      return;
    xhr.setRequestHeader('X-CSRF-Token', CSRF)
  }
})

}()


!!function appInitialize (){
/** begin app **/
var dragging = false;

var Group = Backbone.Model.extend({
  defaults: {
    name: "New Group",
    badges: Array(),
    "public": false
  }
});

var Groups = Backbone.Collection.extend({
  url: '/collection',
  model: Group
})

var AllGroups = new Groups();

var Badge = Backbone.Model.extend({});

var Badges = Backbone.Collection.extend({
  url: '/badge',
  model: Badge,
  parent: null
})
Badges.prototype.on("remove", function (event) {
  console.log('event y');
  console.dir(event);
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
    
    // #TODO: some real error doing ons.
    this.model.save({
      error: function () {
        console.log(':(');
        console.dir(this);
      }
    })
  },
  
  render: function () {
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

  events: {
    'dragstart' : 'start',
    'dragstop' : 'stop'
  },

  start : function (event) {
    console.log('starting to drag');
    dragging = this;
  },
  
  stop : function (event) {
  },
  
  destroy: function () {
    this.$el.css({background: 'red'});
  },
  
  render: function (where) {
    this.el = ich.badgeTpl(this.model.attributes);
    this.$el = $(this.el)
      .hide()
      .appendTo(where)
      .fadeIn();
  }
});


/**
 * Create a view for the body so we can drop badges onto it.
 */
(new (Backbone.View.extend({
  events: {
    'dragover': 'nothing',
    'dragenter': 'nothing',
    'drop': 'maybeRemoveBadge'
  },
  nothing: function (event) {
    event.preventDefault();
  },
  maybeRemoveBadge: function (event) {
    var view = dragging
      , model = view.model;
    
    if (view.model.collection) {
      view.remove();
      model.collection.remove(model);
    } else {
      console.log('new badge, sir');
    }
  }
}))).setElement($('body'));;


/**
 * Create badge models *only for the non-grouped badges*, from bootstrapped
 * page and attach models to views.
 */

Badge.fromElement = function (element) {
  var $el = $(element)
    , model = new Badge({
      id: $el.data('id'),
      image: $el.find('img').attr('src')
    })
  new BadgeView({ model: model }).setElement($el);
  return model;
};

/**
 * Create models from bootstrapped page and attach models to views.
 */

Group.fromElement = function (element) {
  var $el = $(element)
    , badgeElements = $el.find('.badge')
    , groupBadges = new Groups(_.map(badgeElements, Badge.fromElement))
    , model = new Group({
      id: $el.data('id'),
      name: $el.find('input').val(),
      badges: groupBadges
    });
  AllGroups.add(model);
  
  groupBadges.on("remove", function (badge) {
    model.save();
  })
  
  new GroupView({ model: model }).setElement($el);
};

var existingBadges = $('#badges').find('.badge')
  , existingGroups = $('#groups').find('.group');
_.each(existingBadges, Badge.fromElement);
_.each(existingGroups, Group.fromElement);

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