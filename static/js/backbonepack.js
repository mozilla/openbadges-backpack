ich.refresh();

$.fn.sync = function (methodList) {
  var self = this
    , i = methodList.length
    , gogogo
    , methods
    , callback
    , fx = ['fadeIn', 'fadeOut', 'fadeTo', 'slideUp', 'slideDown', 'slideToggle', 'animate']
    , callbackify = function (method, opts) {
      var self = this;
      return function (callback) { 
        callback(null, method.apply(this, opts));
      }
    }
  methodList = [].slice.call(arguments);
  methods = _.map(methodList, function (opts) {
    var methodName =  opts.shift()
      , method = self[methodName];

    if (_.include(fx, methodName)) {
      var startsWith = _.bind(method, self);
      return _.foldl(opts, function (fn, arg) { return _.bind(fn, self, arg); }, startsWith);
    } else {
      return _.bind(callbackify(self[methodName], opts), self);
    }
  });
  
  gogogo = methods[methods.length - 1];
  for (i; methods[i]; i--) {
    gogogo = _.wrap(gogogo, (methods[i-1] || function(f){f()}));
  }
  gogogo();
}



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



/** define: models **/ 
var Badge = Backbone.Model.extend({
  // no defaults
});
var Group = Backbone.Model.extend({
  defaults: {
    name: "New Group",
    badges: function () { new Groups() },
    "public": false
  }
});



/** define: collections **/
var Badges = Backbone.Collection.extend({
  model: Badge,
  belogsTo: null
})
var Groups = Backbone.Collection.extend({
  url: '/collection',
  model: Group
})

Badges.prototype.on('add', function (badge) {
  this.belongsTo.save(null, {
    error: function () {
      console.log(':(');
      console.dir(this);
    },
    success: function (a, b, c) {
      console.log(':D');
      console.dir(this);
    }
  });
});

Badges.prototype.on('remove', function (badge) {
  this.belongsTo.save({
    error: function () {
      console.log(':(');
      console.dir(this);
    },
    success: function () {
      console.log(':D');
      console.dir(this);
    }
  });
});



/** define: views **/
var GroupView = Backbone.View.extend({
  parent: $('#groups'),
  
  tagName: "div",
  
  className: "group",
  
  events: {
    'keyup input': 'checkDone',
    'focus input': 'storeCurrent',
    'blur input': 'maybeUpdate',
    'drop': 'badgeDrop'
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
    this.model.save(null, {
      error: function () {
        console.log(':(');
        console.dir(this);
      },
      success: function () {
        console.log(':D');
        console.dir(this);
      }
    })
  },
  
  addNew: function (event, badge) {
    var newBadge = badge.clone()
      , newView = new BadgeView({model: newBadge})
      , collection = this.model.get('badges');
    collection.add(newBadge);
    newView.render();
    newView.addToGroup(this);
  },

  moveExisting: function (event, badge) {
    var badgeView = dragging;
    badge.collection.remove(badge);
    this.model.get('badges').add(badge);
    badgeView.addToGroup(this);
  },

  badgeDrop: function (event) {
    var view = dragging
      , badge = view.model
      , self = this;
    event.stopPropagation();
    
    if (this.model.get('badges').get(badge)) {
      return;
    }
    if (!badge.collection) {
      return this.addNew(event, badge);
    }
    return this.moveExisting(event, badge);
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
    'dragstart' : 'start'
  },
  start : function (event) {
    dragging = this;
    console.log('drag starting');
  },
  addToGroup: function (groupView) {
    var $el = this.$el
      , $groupEl = groupView.$el
      , isNew = (0 === $groupEl.find('.badge').length)
    
    function doIt () {
      $el.sync(
        ['fadeOut', 2000],
        ['appendTo', $groupEl],
        ['fadeIn', null]
      );
      
      // $el.fadeOut('fast', function () {
      //   $el.appendTo(groupView.$el)
      //   $el.fadeIn('fast')
      // });
    }
    
    if (isNew) {
      $groupEl.find('.instructions').fadeOut('linear', doIt);
    } else {
      doIt();
    }
  },
  render: function () {
    this.el = ich.badgeTpl(this.model.attributes);
    this.$el = $(this.el);
    this.$el.data('view', this);
  }
});


/**
 * Create a new collection for all of the groups to live in.
 */

var AllGroups = new Groups();

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
    var badgeView = dragging
      , badge = badgeView.model;
    
    if (event.target.className === 'group')
      return;
    
    if (badge.collection) {
      badgeView.remove();
      badge.collection.remove(badge);
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
    , groupBadges = new Badges(_.map(badgeElements, Badge.fromElement))
    , model = new Group({
      id: $el.data('id'),
      name: $el.find('input').val(),
      badges: groupBadges
    });
  groupBadges.belongsTo = model;
  AllGroups.add(model);
  
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