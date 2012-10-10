// ensure window can listen to backbone events
_.extend(window, Backbone.Events);


// =======================
// =                     =
// =        MODEL        =
// =                     =
// =======================


/**
 * Individual group model
 */
GroupModel = Backbone.Model.extend({
  urlRoot: '/group',
  defaults: {
    name: "",
    id: -1,
    url: "",
    badges: [],
    pending: true
  },
  /**
   * Save this model: send a CREATE or UPDATE to the server
   */
  save: function(callback) {
    console.log("saving model...");
    if (this.get("pending")) {
      console.log("CREATE: must use callback to obtain real id, post-saving");

      // TODO: replace mockup placeholder with real "save" code + callback
      (function(model){
        var savedModel = new GroupModel({
          name: model.get("name"),
          id: parseInt(1000*Math.random()),
          url: "some random url from database",
          badges: [],
          pending: false        
        });
        callback(savedModel);
      }(this));

    } else {
      console.log("UPDATE: communicating differences");
      callback();
    }
  },
  /**
   * Sync this model: send a READ to the server
   */
  sync: function() {
    console.log("syncing model...");
    console.log("READ: obtaining differences");
  },
  /**
   * Destroy this model: send a DELETE
   */
  destroy: function() {
    console.log("destroying model...");
    if(this.get("pending")) {
      console.log("model had not been saved on the server. Discarding.");
    } else {
      console.log("DELETE: we never want to see this group again");
    }
  }
});


// =======================
// =                     =
// =        VIEWS        =
// =                     =
// =======================


/**
 * View for groups as list items
 */
GroupEntryView = Backbone.View.extend({
  parent: $('.groups .listing'),
  tagName: false,
  /**
   * Render this view to the page
   */
  render: function() {
    var values = this.model.toJSON(),
        html = env.render('GroupView.html', values);
    this.setElement($(html));
    this.setupUX();
    return this;
  },
  /**
   * Set up the UX for this view's element(s),
   * tied to a specific controller for the logic.
   */
  setupUX: function() {
    var controller = this.controller,
        $el = this.$el,
        edit = $el.find(".editGroup");
    // when we click edit, switch to the edit view
    edit.click(function() {
      controller.asEditableEntry();
    });
  }
});


/**
 * View for groups as an editable entity
 */
GroupEditableEntryView = Backbone.View.extend({
  parent: $('.groups .listing'),
  tagName: false,
  /**
   * Render this view to the page
   */
  render: function() {
    var values = this.model.toJSON(),
        html = env.render('GroupEditableView.html', values);
    this.setElement($(html));
    this.setupUX();
    return this;
  },
  /**
   * Set up the UX for this view's element(s),
   * tied to a specific controller for the logic.
   */    
  setupUX: function() {
    var $el = this.$el,
        controller = this.controller;

    window.trigger("group-edit-start","");

    // cancel simply discards everything done so far
    $el.find(".cancel").click(function() {
      // when we cancel, discard group (if new), or switch to the list item view
      controller.cancelEdit();
      window.trigger("group-cancelled","");
      window.trigger("group-edit-end","cancelled");
    });

    // save tells the server to save this group,
    // and then converst the group's "new" template 
    // to a normal group listing entry, instead.
    $el.find(".save").click(function() {
      console.log("save pressed");

      // make sure we have a group title.
      var input = $el.find(".groupName");
      if(input.val().trim() === "") {
        // TODO: Notify the user visually that they haven't filled in a group name yet?
        input.focus();
        return;
      }

      // Prevent further save/cancel operations
      $el.find(".editable").remove();
      controller.setName($el.find(".groupName").val());
      controller.save(function(){
        // after we save, switch to the list item view
        controller.asEntry();
        window.trigger("group-saved","");
        window.trigger("group-edit-end","saved");
      });
    });
  }
});


// =======================
// =                     =
// = CONTROLLERS: Groups =
// =                     =
// =======================


/**
 * Collection object for all groups
 */
GroupCollection = Backbone.Collection.extend({
  model: GroupModel
});


// =======================
// =                     =
// = CONTROLLERS: Group  =
// =                     =
// =======================


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
  } else { groupModel = new GroupModel(); }
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
      badges = [];
  var group = new Group(name, id, url, badges);
  $el.replaceWith(group.asEntry().$el);
  return group;
};

/**
 * Group object representation - prototype
 */
Group.prototype = {
  // shared by all instances
  collection: new GroupCollection(),

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

    // make sure to add this group to the group collection, too
    this.collection.add(groupModel);
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
      update = function(newModel) {
        // Destroy temporary model
        var oldEl = group.currentView.$el;
        group.destroy(true);
        // Bind new, server-correct model
        group.setModel(newModel);
        // Update the page by adding the
        // group as normal entry.
        group.asEntry();
        var newEl = group.currentView.$el;
        oldEl.replaceWith(newEl);
        // fall through to original callback
        callback();
      };
    }
    this.model.save(update);
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
  },

  /**
   * Destroy this group (delegated to model and view)
   */
  destroy: function(keepView) {
    this.collection.remove(this.model);
    this.model.destroy();
    if (!keepView) {
      this.currentView.$el.remove();
    }
  }
};

// ensure correct constructor identifier
Group.prototype.constructor = Group;
