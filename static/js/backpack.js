!!function setup () {

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

}(/*end setup*/)


!!function appInitialize (){

var global = {
  dragging: false
}

var Badge = {}
  , Group = {}
  , Message = {}
  , Details = {}

// Helper functions
// ----------------------
/**
 * Handle Backbone.sync errors.
 * 
 * @param {Model} model the model attempting to be saved
 * @param {XHRObject} xhr the xhr request object.
 */
var errHandler = function (model, xhr) {
  new Message.View().render({
    type: 'error',
    message:'There was a problem syncing your changes. Please refresh the page before making any new changes.'
  });
}

// Model Definitions
// ----------------------
Badge.Model = Backbone.Model.extend({
  urlRoot: '/badge'
});

Group.Model = Backbone.Model.extend({
  urlRoot: '/group',
  defaults: {
    name: "New Group",
    "public": false
  }
});

// Collection definitions
// ----------------------
Badge.Collection = Backbone.Collection.extend({
  model: Badge.Model,
  belongsTo: null
})
Group.Collection = Backbone.Collection.extend({
  model: Group.Model
})

/**
 * Save the group that this badge collection belongs to.
 * If there's an error, create a new message telling the user to refresh
 * the page before doing anything else.
 *
 * @see errHandler
 */
Badge.Collection.saveParentGroup = function () {
  if (!this.belongsTo) return;
  this.belongsTo.save(null, { error: errHandler });
}

Badge.Collection.prototype.on('add', Badge.Collection.saveParentGroup)

Badge.Collection.prototype.on('remove', Badge.Collection.saveParentGroup)


// View Definitions
// ----------------------
Message.View = Backbone.View.extend({
  parent: $('#message-container'),
  tagName: 'div',
  className: 'message',
  events: {},
  render: function (attributes) {
    var $element = ich.messageTpl(attributes);
    this.parent.empty();
    $element
      .hide()
      .css({opacity: 0})
      .appendTo(this.parent)
      .animate({opacity: 1}, {queue: false, duration: 'slow'})
      .slideDown('slow');
    this.setElement($element);
    return this;
  }
})

Group.View = Backbone.View.extend({
  parent: $('#groups'),
  tagName: "div",
  className: "group",
  events: {
    'keyup input': 'checkDone',
    'focus input': 'storeCurrent',
    'blur input': 'saveName',
    'drop': 'badgeDrop',
    'mousedown .delete': 'preventDefault',
    'click .delete': 'destroy',
    'click .share': 'share'
  },
  
  preventDefault: function (event) {
    event.preventDefault();
    return false;
  },
  
  
  share: function (event) {
    console.log('oh sup');
  },
  
  /**
   * Store the name of the group at the beginning of the editing session so
   * we can either revert it if the user cancels or skip hitting the server if
   * the user tries to save the same name.
   *
   * @param {Event} event
   */
  storeCurrent: function (event) {
    var $el = $(event.currentTarget);
    $el.data('previously', $el.val());
  },
  
  
  /**
   * Monitor keypresses to see if the user is done editing.
   *
   * @param {Event} event
   */
  checkDone: function (event) {
    var $el = $(event.currentTarget);
    
    switch (event.keyCode) {
      // enter key, user wants to save
     case 13:
      $el.trigger('blur');
      break;
      
      // escape key, user wants to revert changes
     case 27:
      $el.val($el.data('previously'));
      $el.trigger('blur');
      break;
    }
  },
  
  
  /**
   * Destroy this view (with style).
   *
   * @param {Event} event
   */
  destroy: function (event) {
    var group = this.model
      , allGroups = group.collection;
    allGroups.remove(group);
    this.$el.addClass('dying');
    this.$el.animate({opacity: 0});
    this.$el.slideUp(null, this.remove.bind(this));
  },
  
  
  /**
   * Save the new name of the group model associated with this view.
   * Doesn't hit the server if the name didn't actually change.
   *
   * @param {Event} event
   */
  saveName: function (event) {
    var $el = $(event.currentTarget)
      , newName = $el.val()
      , oldName = $el.data('previously')
    
    // Bail early if the name didn't change.
    if (newName === oldName) return;
    
    this.model.set({ name: newName });
    this.model.save(null, { error: errHandler });
  },
  
  
  /**
   * Copies a badge from the master list to this group.
   * 
   * @param {Event} event
   * @param {Model} badge model to be copied.
   *
   * @see Badge.View#addToGroup
   */
  addNew: function (event, badge) {
    var newBadge = new Badge.Model(badge.attributes)
      , newView = new Badge.View({model: newBadge})
      , collection = this.model.get('badges');
    collection.add(newBadge);
    newView.render();
    newView.addToGroup(this);
  },

  
  /**
   * Move badge from existing group to this group.
   * 
   * @param {Event} event
   * @param {Model} badge model to be moved.
   * 
   * @see Badge.View#addToGroup
   */
  moveExisting: function (event, badge) {
    var badgeView = global.dragging;
    badge.collection.remove(badge);
    this.model.get('badges').add(badge);
    badgeView.addToGroup(this);
  },

  
  /**
   * Figure out what to do with the badge that has been dropped here.
   * If the badge is from an existing group, move it. If it's from
   * the master badge list, copy it.
   *
   * @param {Event} event
   *
   * @see Group.View#addToGroup
   * @see Group.View#moveExisting
   */
  badgeDrop: function (event) {
    var view = global.dragging
      , badge = view.model
      , collection = this.model.get('badges');
    
    // prevent bug in firefox: https://bugzilla.mozilla.org/show_bug.cgi?id=727844
    event.preventDefault();
    event.stopPropagation();
    
    if (collection.get(badge)) {
      return;
    } 
    
    if (!badge.collection || badge.collection === AllBadges) {
      return this.addNew(event, badge);
    }
    return this.moveExisting(event, badge);
  },
  
  
  /**
   * Render this sucker. Uses ICanHaz.js to find a template with the
   * id "#groupTpl"
   */
  render: function () {
    this.el = ich.groupTpl(this.model.attributes);
    this.setElement($(this.el));
    this.$el
      .hide()
      .appendTo(this.parent)
      .fadeIn();
    return this;
  }
});

Details.View = Backbone.View.extend({
  badgeView: null,
  events: {
    'click .close': 'hide',
    'mousedown .close': 'nothing',
    'click .badge-image': 'debugBadge',
    'click .disown': 'showConfirmation',
    'click .confirm-disown .nope': 'hideConfirmation',
    'click .confirm-disown .yep': 'destroyBadge'
  },
  
  debugBadge: function (event) {
    console.dir(this.model.get('body'));
  },
  
  showConfirmation: function () {
    this.$el.find('.confirm-disown').fadeIn('fast');
  },
  
  hideConfirmation: function () {
    this.$el.find('.confirm-disown').fadeOut('fast');
  },
  
  destroyBadge: function () {
    var badge = this.model;
    _.each(AllGroups.models, function (group) {
      var collection = group.get('badges');
      if (collection.get(badge)) {
        collection.remove(badge);
      }
    });
    _.each(Badge.View.all, function (view) {
      if (view.model.id === badge.id) view.$el.fadeOut('fast');
    });
    badge.destroy();
    this.hide();
  },
  
  nothing: function (event) {
    event.preventDefault();
    event.stopPropagation();
  },
  
  hide: function() {
    this.$el
      .stop()
      .fadeOut('fast', function () {
        $(this).detach()
      });
    this.hideConfirmation();
    return false;
  },
  
  show: function () {
    this.$el
      .hide()
      .appendTo($('body'))
      .fadeIn('fast');
  },
  
  render: function () {
    ich.grabTemplates();
    this.el = ich.detailsTpl(this.model.attributes);
    this.setElement(this.el);
    this.$el.data('view', this);
    return this;
  }
});

Badge.View = Backbone.View.extend({
  tagName: "a",
  className: "badge",
  detailsView: null,
  events: {
    'click' : 'showDetails',
    'dragstart' : 'start'
  },
  
  initialize: function () {
    Badge.View.all.push(this);
  },
  
  showDetails: function (event) {
    this.detailsView.show();
  },
  
  /**
   * Store this view in a semi-global variable (closed-over) variable
   * so we can look it up later on drops.
   *
   * @param {Event} event
   */
  start : function (event) {
    global.dragging = this;
    event.stopPropagation();
  },
  
  
  /**
   * Add this badge view to a group view. Do some fancy fx during the dom transition.
   * 
   * @param {View} groupView the view to add this badge to.
   */
  addToGroup: function (groupView) {
    var $el = this.$el
      , $groupEl = groupView.$el
      , isNew = $groupEl.hasClass('isNew')
    
    $groupEl.removeClass('isNew');
    
    function doIt () {
      $el.sync(
        ['fadeOut', 'fast'],
        ['appendTo', $groupEl],
        ['fadeIn', 'fast']
      );
    }
    
    if (isNew) {
      // first create a new group to use as a drop target
      var newBadgeCollection = new Badge.Collection([])
        , newGroupModel = new Group.Model({badges: newBadgeCollection})
        , newGroupView = new Group.View({model: newGroupModel});
      newBadgeCollection.belongsTo = newGroupModel;
      newGroupView.render();
      
      // then add the badge view to old group drop target
      $groupEl.find('.instructions').fadeOut('linear', doIt);
    } else {
      doIt();
    }
  },
  
  /**
   * Render this sucker. Uses ICanHaz.js to find a template with the
   * id "#badgeTpl"
   */
  render: function () {
    this.el = ich.badgeTpl(this.model.attributes);
    this.$el.data('view', this);
    this.setElement($(this.el));
    this.attachToExisting($(this.el));
    return this;
  },

  attachToExisting: function (el) {
    this.detailsView = new Details.View({ model: this.model });
    this.detailsView.render();
    this.setElement($(el));
    return this;
  },
});

Badge.View.all = [];

/**
 * Create a new collection for all of the groups to live in.
 */
var AllGroups = new Group.Collection();
var AllBadges = new Badge.Collection();
AllGroups.on('remove', function (group) {
  group.destroy();
});

/**
 * Create a view for the body so we can drop badges onto it.
 */
(new (Backbone.View.extend({
  events: {
    'keyup': 'keys',
    'dragover': 'nothing',
    'dragenter': 'nothing',
    'drop': 'maybeRemoveBadge'
  },
  keys: function (event) {
    if (event.keyCode === 27) {
      $('.lightbox').data('view').hide();
    }
  },
  nothing: function (event) {
    event.preventDefault();
  },
  maybeRemoveBadge: function (event) {
    var badgeView = global.dragging
      , badge = badgeView.model;
    
    if (event.target.className === 'group')
      return;
    
    if (badge.collection && badge.collection !== AllBadges) {
      badgeView.remove();
      badge.collection.remove(badge);
    }
  }
}))).setElement($('body'));;


/**
 * Create models from bootstrapped page and attach models to views.
 *
 * @param {HTMLElement} element
 */
Group.fromElement = function (element) {
  var $el = $(element)
    , badgeElements = $el.find('.badge')
    , groupBadges = new Badge.Collection(_.map(badgeElements, Badge.fromElement))
    , model = new Group.Model({
      id: $el.data('id'),
      name: $el.find('input').val(),
      badges: groupBadges
    });
  groupBadges.belongsTo = model;
  AllGroups.add(model);
  new Group.View({ model: model }).setElement($el);
};

/**
 * Create badge models *only for the non-grouped badges*, from bootstrapped
 * page and attach models to views.
 *
 * @param {HTMLElement} element
 */
Badge.fromElement = function (element) {
  var $el = $(element)
    , model = new Badge.Model(window.badgeData[$el.data('id')])
  new Badge.View({ model: model }).attachToExisting($el);
  if (!AllBadges.get(model.id)) AllBadges.add(model);
  return model;
};

// creating models from html on the page
var existingBadges = $('#badges').find('.badge')
  , existingGroups = $('#groups').find('.group');
_.each(existingBadges, Badge.fromElement);
_.each(existingGroups, Group.fromElement);

//end app scope
}();
