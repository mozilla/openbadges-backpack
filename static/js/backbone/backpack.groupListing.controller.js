var GroupListing = function(badgeCollection) {
  this.setModel(new GroupListingModel());
  this.badgeCollection = badgeCollection;
};


/**
 * Group listing object representation - 'copy' constructor
 *
 * @param {HTMLElement} element that acts as construction template
 */
GroupListing.fromElement = function (element, badgeCollection) {
  var $el = $(element),
      section = $el.find("section");
  
  // set up a new listing
  var listing = new GroupListing();
  listing.badgeCollection = badgeCollection;

  // find all groups we need to boostrap, too
  var groups = section.find(".listing .group");
  var newSection = listing.render().$el;
  section.replaceWith(newSection);  

  // if more than 0 groups, remove notice and
  // bootstrap group objects.
  if(groups.length>0) {
    listing.removeNoGroupNotice();
    groups.each(function(){
      var group = listing.createGroupFromElement(this);
      group.owner = listing;
    });
  }

  // done
  return listing;
};

/**
 * Group listing object representation - prototype
 */
GroupListing.prototype = {
  model: null,
  views: null,
  currentView: null,
  badgeCollection: null,

  /**
   * Set the model for this group
   */
  setModel: function(GroupListingModel) {
    this.model = GroupListingModel;
    GroupListingModel.controller = this;
    this.views =  {
      listing: new GroupListingView({model: GroupListingModel})
    };
    this.views.listing.controller = this;
    this.currentView = this.views.listing;
    this.render();
  },

  /**
   * Render this listing (delegated to current view)
   */
  render: function() {
    return this.currentView.render(this.model);
  },

  /**
   * Create a group and add it to the list of known groups.
   */
  createGroup: function(name, id, url, badges) {
    var group;
    if(name && id && url && badges) { group = new Group(name, id, url, badges); }
    else { group = new Group(); }
    group.owner = this;
    this.model.addGroup(group);
    return group;
  },

  /**
   * Bootstrap a group and add it to the list of known groups.
   */
  createGroupFromElement: function(element) {
    var group = Group.fromElement(element);
    group.owner = this;
    this.model.addGroup(group);
    this.currentView.$el.find("ul.listing").append(group.currentView.$el);
    return group;
  },
  
  /**
   * If loaded with groups, remove the "you have no groups" notice.
   */
  removeNoGroupNotice: function() {
    this.currentView.removeNoGroupNotice();
  },

  /**
   * Ensure we only have one group open for editing:
   * administrative variable.
   */
  currentlyEditing: null,

  /**
   * Ensure we only have one group open for editing:
   * when a group notifies us that it has changed
   * to edit view, and another group's already in
   * edit view, change the already open group to
   * normal listing view again.
   */
  setEditGroup: function(group) {
    if (this.currentlyEditing !== null) {
      this.currentlyEditing.asEntry();
    }
    this.currentlyEditing = group;
    this.badgeCollection.addBadgePickers(group);
  },

  /**
   * Delegate to view
   */
  editCancelled: function(group) {
    this.currentView.editCancelled();
    this.editFinished(group);
  },
  
  /**
   * Edit finished
   */
  editFinished: function(group) {
    this.badgeCollection.removeBadgePickers();
  }
};

// ensure correct constructor identifier
GroupListing.prototype.constructor = GroupListing;
