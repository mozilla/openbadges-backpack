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
    badges: [],
    pending: true
  },

  /**
   * Form a server-side compatible object representation.
   */
  toGroupAttributes: function() {
    return { group: { attributes: this.toJSON() }};
  },
  /**
   * Save this model: send a CREATE or UPDATE to the server
   */
  saveModel: function(callback) {
    console.log("saving model...");

    var sucFn = (function(model, callback) {
      return function() {
        console.log("saving succeeded");
        model.set("pending",false);
        if(callback) callback();
      }
    }(this, callback));

    var errFn = (function(model, callback) {
      return function() {
        console.log("saving failed!");
        if(callback) callback();
      }
    }(this, callback));

    if (this.get("pending")) {
      console.log("CREATE: must use callback to obtain real id, post-saving");
      this.save(null, { success : sucFn, error: errFn });
    } else {
      console.log("UPDATE: updating the server");
      this.save(null, { success : sucFn, error: errFn });
    }
  },

  /**
   * Destroy this model: send a DELETE
   */
  destroyModel: function() {
    console.log("destroying model...");
    if(this.get("pending")) {
      console.log("model had not been saved on the server. Simply discarding.");
    } else {
      console.log("DELETE: we never want to see this group again");
      this.destroy();
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
  /**
   * Render this view to the page
   */
  render: function() {
    var values = this.model.toGroupAttributes(),
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
        edit = $el.find(".editGroup"),
        x = $el.find(".deleteGroup");
    // when we click edit, switch to the edit view
    edit.click(function() {
      controller.asEditableEntry();
    });
    // when we click (X), delete the group
    x.click(function() {
      controller.destroy();
    });
  }
});


/**
 * View for groups as an editable entity
 */
GroupEditableEntryView = Backbone.View.extend({
  parent: $('.groups .listing'),
  /**
   * Render this view to the page
   */
  render: function() {
    var values = this.model.toGroupAttributes(),
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
    this.model.destroyModel();
    if (!keepView) {
      this.currentView.$el.remove();
    }
  }
};

// ensure correct constructor identifier
Group.prototype.constructor = Group;
