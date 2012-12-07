/**
 * Group object representation - constructor
 *
 * @param {String}  name    The group's name
 * @param {Number}  id      The group's identifier
 * @param {String}  url     The group's dedicated URL
 * @param {Badge[]} badges  The group's list of badges
 *
 * The constructor may be called either without
 * any arguments, or with all four listed arguments.
 *
 * If no arguments are provided, a "new" group will
 * be created by the constructor. Such a group has
 * special behaviour when saved, as it will need to
 * get its server-side id after saving.
 */
var Group = function(name, id, url, badges) {
  // set up the model for this group
  var groupModel;
  if(name && id && url && badges) {
    groupModel = new GroupModel({
      name: name,
      id: id,
      url: url,
      badges: badges,
      pending: false
    });
  } else {
    groupModel = new GroupModel();
    // FIXME: THIS SHOULD NOT BE NECESSARY
    groupModel.set("badges",[]);
  }
  this.setModel(groupModel);
};

/**
 * Group object representation - 'copy' constructor
 *
 * @param {HTMLElement} element that acts as construction template
 */
Group.fromElement = function (element) {
  var $el = $(element),
      id = $el.data('id'),
      url = $el.data('url'),
      name = $el.find('.groupName').text(),
      badgeList = $el.find(".badgeList").val(),
      badges = (badgeList ? (new Function("return ["+badgeList+"]"))() : []);
  var group = new Group(name, id, url, badges);
  $el.replaceWith(group.asEntry().$el);
  return group;
};

/**
 * Group object representation - prototype
 */
Group.prototype = {

  // owning GroupListing object
  owner: null,

  // local model and views (filled by constructor)
  model: null,
  views: null,

  // "this is what it looks like now" reference
  currentView: null,
  
  /**
   * Name this group
   */
  setName: function(name) {
    this.model.set("name", name);
  },

  /**
   * Set the model for this group
   */
  setModel: function(groupModel) {
    this.model = groupModel;
    
    // Mark us as controller. Backbone does not have
    // explicit controllers, so we're doing it this way.
    groupModel.controller = this;

    // set up the views for this group
    this.views =  {
      entry: new GroupEntryView({model: groupModel}),
      editableEntry: new GroupEditableEntryView({model: groupModel})
    };

    this.views.entry.controller = this;
    this.views.editableEntry.controller = this;
    
    this.currentView = this.views.entry;
    this.render();
  },

  /**
   * Render this group (delegated to current view)
   */
  render: function() {
    return this.currentView.render(this.model);
  },

  /**
   * Switch to "entry" view for this Group
   */
  asEntry: function() {
    return this.replaceView(this.views.entry);
  },

  /**
   * Switch to editable entry view for this Group
   */
  asEditableEntry: function() {
    if (this.owner !== null) {
      this.owner.setEditGroup(this);
    }
    return this.replaceView(this.views.editableEntry);
  },

  /**
   * Switch views for this Group
   */
  replaceView: function(newView) {
    var oldEl = this.currentView.$el;
    this.currentView = newView;
    var child = this.render();
    oldEl.replaceWith(child.$el);
    return child;
  },

  /**
   * Save this group (delegated to model)
   */
  save: function(callback) {
    var group = this;
    var update = callback;
    
    if(this.model.get("pending")) {
      update = function() {
        group.asEntry();
        // fall through to original callback
        callback();
      };
    }
    this.model.saveModel(update);
    this.owner.editFinished(this);
  },
  
  /**
   * Cancel an edit; if a new group,
   * simply destroy the group. If an
   * existing group, revert to a list
   * entry view.
   */
  cancelEdit: function() {
    if (this.model.get("pending")) {
      this.destroy();
    } else {
      this.asEntry();
    }
    if (this.owner !== null) {
      this.owner.editCancelled(this);
    }
  },

  /**
   * Destroy this group (delegated to model and view)
   */
  destroy: function(keepView) {
    this.model.destroyModel();
    if (!keepView) {
      this.currentView.$el.remove();
    }
  },
  
  /**
   * Add a badge to this group
   */
  addBadge: function(badgeId) {
    this.model.addBadge(parseInt(badgeId)); // NOTE: string -> number
  },

  /**
   * Do we have this bagde in the group?
   */
  hasBadge: function(badgeId) {
    return this.model.hasBadge(parseInt(badgeId)); // NOTE: string -> number
  },

  /**
   * Remove a badge from this group
   */
  removeBadge: function(badgeId) {
    this.model.removeBadge(parseInt(badgeId)); // NOTE: string -> number
  },
  
  /**
   * Get the list of contained badges
   */
  getBadgeList: function() {
    return this.model.getBadgeList();
  }
};

// ensure correct constructor identifier
Group.prototype.constructor = Group;
