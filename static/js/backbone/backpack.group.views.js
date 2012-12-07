// ensure window can listen to backbone events
_.extend(window, Backbone.Events);

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
        html = env.render('Backpack.Group.View.html', values);
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
        html = env.render('BAckpack.Group.EditableView.html', values);
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

    window.trigger("group-edit-start", {group: controller});

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

    // show all contained badges in badge area
    controller.getBadgeList().forEach(function(v) {
      var badge = $(".badge[data-id="+v+"]");
      view.addToBadgeArea($(badge[0].cloneNode()));
    });


    // make badges droppable on the badgeArea
    // TODO: REFACTOR SO THAT THIS IS IN THE BADGE COLLECTION
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
      view.addToBadgeArea(badge);
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
  addToBadgeArea: function(badge) {
    var badgeArea = this.$el.find('.badgeArea');
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