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
      console.log("CREATE: backbone will update the model with the new values for us");
      this.save(null, { success : sucFn, error: errFn });
    } else {
      console.log("UPDATE: updating the server-side model");
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
  },
  
  /**
   * Add a badge id to this group's list of contained badges.
   */
  addBadge: function(badgeId) {
    var badges = this.get("badges");
    console.log("trying to add "+badgeId+" into ",badges);
    if(badges.indexOf(badgeId)===-1) {
      console.log("adding badgeId "+badgeId+" to group model");
      badges.push(badgeId);
    }
    console.log("list after adding: "+badges);
  },

  /**
   * Remove a badge id from this group's list of contained badges.
   */
  removeBadge: function(badgeId) {
    var badges = this.get("badges"),
        pos = badges.indexOf(badgeId);
    console.log("trying to remove "+badgeId+" (pos: "+pos+") from ",badges);
    if(pos!==-1) {
      console.log("removing badgeId "+badgeId+" from group model");
      badges.splice(pos,1);
    }
    console.log("list after removing: "+badges);
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
    var view = this,
        $el = this.$el,
        controller = this.controller;

    window.trigger("group-edit-start","");

    // cancel simply discards everything done so far
    $el.find(".cancel").click(function() {
      // when we cancel, discard group (if new), or switch to the list item view
      removeBadgePickers();
      controller.cancelEdit();
      window.trigger("group-cancelled","");
      window.trigger("group-edit-end","cancelled");
    });

    // save tells the server to save this group,
    // and then converst the group's "new" template 
    // to a normal group listing entry, instead.
    $el.find(".save").click(function() {
      console.log("save pressed");
      removeBadgePickers();
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

    // Drag and drop behaviour
    var badgeArea = $el.find('.badgeArea');
    addBadgePickers(this, badgeArea);

    // show all contained badges in badge area
    controller.getBadgeList().forEach(function(v) {
      var badge = $(".badge[data-id="+v+"]");
      view.addToBadgeArea(badgeArea, $(badge[0].cloneNode()));
    });

    // make badges droppable on the badgeArea
    $(".badge").each(function(){
      this["oldDragStart"] = this.ondragstart;
      this.ondragstart = function(e) {
        e.dataTransfer.setData("data-id", this.getAttribute("data-id"));
        $(this).popover('hide',{delay:0});
      };
    });

    // required to make ondrop work for the badge area
    badgeArea[0].ondragover = function(e) { e.preventDefault(); };

    // When a badge is dropped, find out which
    // badge is supposed to be added, and clone it
    // into the badge area.
    badgeArea[0].ondrop = function(e) {
      e.preventDefault();

      var dataId = e.dataTransfer.getData("data-id"),
          badgeSelector = ".badge[data-id="+dataId+"]";

      // check whether we already have this badge
      if(view.isBadgeInArea(dataId)) {
        return;
      }

      // we don't, add it to the badge area from the
      // collection of badges.
      var badge = $(badgeSelector)[0];
      if(!badge) {
        return;
      }
      badge = $(badge.cloneNode());

      // add it to the badge area
      view.addToBadgeArea(badgeArea, badge);
      view.controller.addBadge(dataId);
    };
  },

  /**
   * is this badge already in the new group's badge area?
   */
  isBadgeInArea: function(dataId) {
    var badgeArea = $('.badgeArea'),
        badgeSelector = ".badge[data-id="+dataId+"]";
    return $(badgeSelector, badgeArea).length>0;
  },

  /**
   * remove a badge from the new group badge area
   */
  removeFromBadgeArea: function(badgeArea, dataId) {
    var badgeSelector = ".badge[data-id="+dataId+"]";
    $(badgeSelector, badgeArea).remove();
  },

  /**
   * add a "remove" button to the badgearea copy of the badge
   */
  addRemoveButton: function(badgeArea, badge) {
    var view = this,
        dataId = badge.attr("data-id"),
        created = $("<div class='actions'>"
                 + "  <button class='btn removeFromGroup' data-id='"+dataId+"'>Remove</button>"
                 + "</div>");
    $("button",created).click(function(){
      badge.popover('hide');
      view.controller.removeBadge(dataId);
      view.removeFromBadgeArea(badgeArea, dataId);
    });
    badge.append(created);
  },

  /**
   * add a badge to the badge area for a new group
   */
  addToBadgeArea: function(badgeArea, badge) {
    badge.appendTo(badgeArea).fadeIn().popover({delay: 200});

    // give this badge "remove" drag and drop behaviour
    badge[0].ondragstart = function(e) {
      e.dataTransfer.setData("data-id", this.getAttribute("data-id"));
      badge.addClass("seethrough");
      badge.popover('hide',{delay:0});
    };
    badge[0].ondragend = function(e) {
      var mx = e.clientX, my = e.clientY;
      var bbox = badgeArea[0].getBoundingClientRect();
      if(mx < bbox.left || mx > bbox.right ||  my < bbox.top || my > bbox.bottom) {
        badge.remove();
      } else {
        badge.removeClass("seethrough");
      }
    }

    // kill off instructions. If they're already
    // killed off, this just does nothing.
    $(".instructions",badgeArea).remove();
    this.addRemoveButton(badgeArea, badge);
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
  },
  
  /**
   * Add a badge to this group
   */
  addBadge: function(badgeId) {
    this.model.addBadge(parseInt(badgeId)); // NOTE: string -> number
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
    return this.model.get("badges");
  }
};

// ensure correct constructor identifier
Group.prototype.constructor = Group;
