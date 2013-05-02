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
if(!nunjucks.env) {
    nunjucks.env = new nunjucks.Environment(new nunjucks.HttpLoader('/views'));
}
if (!nunjucks.env.globals)
  nunjucks.env.globals = {};
$.extend(nunjucks.env.globals, {
  csrfToken: CSRF
});
nunjucks.env.addFilter('formatdate', function (rawDate) {
  if (parseInt(rawDate, 10) == rawDate) {
    var date = new Date(rawDate * 1000);
    return date.toString();
  }
  return rawDate;
});
}(/*end setup*/)


!!function appInitialize (){

var global = {
  dragging: false
}

var Badge = {}
var Group = {}
var Message = {}
var Details = {}

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

/**
 * Nunjucks template helper
 */
var template = function template(name, data) {
    return $(nunjucks.env.render(name, $.extend(data, nunjucks.env.globals)));
}

// Model Definitions
// ----------------------
Badge.Model = Backbone.Model.extend({
  urlRoot: '/badge',
  isExpired: function() {
    // parse a date in yyyy-mm-dd format
    // taken from http://stackoverflow.com/a/2587398
    var parseDate = function parseDate(input) {
      var parts = input.match(/(\d+)/g);
      // new Date(year, month [, date [, hours[, minutes[, seconds[, ms]]]]])
      return new Date(parts[0], parts[1]-1, parts[2]); // months are 0-based
    }
    
    var expiry = parseDate(this.attributes.body.expires).getTime();
    
    return Date.now() - expiry > 0;
  }
});

Group.Model = Backbone.Model.extend({
  urlRoot: '/group',
  defaults: {
    name: "New Collection",
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
    var $element = template('message-template.html', attributes);
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
    'click .share': 'share',
    'change .js-privacy': 'savePrivacy'
  },

  preventDefault: function (event) {
    event.preventDefault();
    return false;
  },


  share: function (event) {
    window.location = '/share/' + this.model.get('url') + '/';
    return false;
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
    var allGroups = group.collection;
    allGroups.remove(group);
    this.$el.addClass('dying');
    this.$el.animate({opacity: 0});
    this.$el.slideUp(null, this.remove.bind(this));
  },

  /**
   * Save the privacy setting of the group.
   *
   * @param {Event} event
   */
  savePrivacy: function (event) {
    var $el = $(event.currentTarget)
    this.model.set({ 'public': $el.prop('checked') })
    this.model.save(null, { error: errHandler })
  },

  /**
   * Save the new name of the group model associated with this view.
   * Doesn't hit the server if the name didn't actually change.
   *
   * @param {Event} event
   */
  saveName: function (event) {
    var $el = $(event.currentTarget)
    var newName = $el.val()
    var oldName = $el.data('previously')

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
    var newView = new Badge.View({model: newBadge})
    var collection = this.model.get('badges');
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
    var badge = view.model
    var collection = this.model.get('badges');

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
   * Render this sucker.
   */
  render: function () {
    this.el = template('group-template.html', this.model.attributes);
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
    'click .background': 'hide',
    'mousedown .close': 'nothing',
    'click .badge-image': 'debugBadge',
    'click .disown': 'showConfirmation',
    'click .confirm-disown .nope': 'hideConfirmation',
    'click .confirm-disown .yep': 'destroyBadge',
    'click .facebook-share': 'showFacebookModal',
    'click .confirm-facebook-share .nope': 'hideFacebookModal'
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

  showFacebookModal: function () {
	  this.$el.find('.confirm-facebook-share').fadeIn('fast');
  },

  hideFacebookModal: function () {
	  this.$el.find('.confirm-facebook-share').fadeOut('fast');
  },

  destroyBadge: function () {
    var badge = this.model;
    _.each(AllGroups.models, function (group) {
      var collection = group.get('badges');
      if (collection.get(badge)) {
        collection.remove(badge);
      }
    });
    this.hide();
    _.each(Badge.View.all, function (view) {
      if (view.model.id === badge.id) {
        view.$el.fadeOut('slow', function() {
          var $parent = $(this.parentNode);
          if ($parent.hasClass('openbadge-container')) {
            $parent.remove();
          } else {
            $(this).remove();
          }
        });
      }
    });
    badge.destroy();
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
    this.el = template('badge-details.html', { 
      badge: { 
        attributes: this.model.attributes 
      },
      disownable: true
    });
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
    this.$el.popover('hide');
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
    var $groupEl = groupView.$el
    var isNew = $groupEl.hasClass('isNew')

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
      var newGroupModel = new Group.Model({badges: newBadgeCollection})
      var newGroupView = new Group.View({model: newGroupModel});

      // Add model to the list of all the groups and retain a reference
      var allGroups = groupView.model.collection;
      allGroups.add(newGroupView.model);
      newGroupView.model.collection = allGroups;

      newBadgeCollection.belongsTo = newGroupModel;
      newGroupView.render();

      // then add the badge view to old group drop target
      $groupEl.find('.instructions').fadeOut('linear', doIt);
    } else {
      doIt();
    }
  },

  /**
   * Render this sucker.
   */
  render: function () {
    this.el = template('badges_partial.html', this.model.attributes);
    this.$el.data('view', this);
    this.setElement($(this.el));
    this.attachToExisting($(this.el));
    return this;
  },

  attachToExisting: function (el) {
    this.detailsView = new Details.View({ model: this.model });
    this.detailsView.render();
    this.setElement($(el));
    $(el).popover({
      animation:false,
      trigger: 'hover',
      html: true
    });
    return this;
  },

  remove: function () {
    this.$el.popover('hide');
    Backbone.View.prototype.remove.call(this);
  }
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
    event.preventDefault();

    var badgeView = global.dragging
    var badge = badgeView.model;

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
  var badgeElements = $el.find('.openbadge')
  var groupBadges = new Badge.Collection(_.map(badgeElements, Badge.fromElement))
  var model = new Group.Model({
    id: $el.data('id'),
    url: $el.data('url'),
    name: $el.find('.groupName').val(),
    'public': $el.find('.js-privacy').prop('checked'),
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
  var model = new Badge.Model($el.data('serialization'));
  new Badge.View({ model: model }).attachToExisting($el);
  if (!AllBadges.get(model.id)) AllBadges.add(model);
  return model;
};

// creating models from html on the page
var existingBadges = $('#badges').find('.openbadge')
var existingGroups = $('#groups').find('.group');
_.each(existingBadges, Badge.fromElement);
_.each(existingGroups, Group.fromElement);

window.Badge = Badge;
//end app scope
}();
