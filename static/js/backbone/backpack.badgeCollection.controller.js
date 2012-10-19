var BadgeCollection = function() {
  this.setModel(new BadgeCollectionModel());
};


/**
 * Group listing object representation - 'copy' constructor
 *
 * @param {HTMLElement} element that acts as construction template
 */
BadgeCollection.fromElement = function (element) {
  var $el = $(element);
  
  // set up a new collection
  var collection = new BadgeCollection();

  // find all badges that we need to boostrap, too
  var badges = element.find(".badge");

  // replace the collection with the backbone'd collection
  var $newEl = collection.render().$el;
  $el.replaceWith($newEl);

  // if more than 0 badges, create badges inside
  // this collection.
  if(badges.length>0) {
    badges.each(function() {
      var badge = collection.createBadgeFromElement(this);
      collection.addBadge(badge);
    });
  }

  // done
  return collection;
};

/**
 * Group listing object representation - prototype
 */
BadgeCollection.prototype = {
  model: null,
  views: null,
  currentView: null,

  /**
   * Set the model for this group
   */
  setModel: function(BadgeCollectionModel) {
    this.model = BadgeCollectionModel;
    BadgeCollectionModel.controller = this;
    this.views =  {
      listing: new BadgeCollectionView({model: BadgeCollectionModel})
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
   * Create a badge and add it to the list of known badges.
   */
  createBadge: function(a,b,c,d) {
    var badge;
    if(a && b && c && d) { badge = new Badge(a,b,c,d); }
    else { badge = new Badge(); }
    badge.owner = this;
    this.model.addBadge(badge);
    return badge;
  },

  /**
   * Bootstrap a badge and add it to the list of known badges.
   */
  createBadgeFromElement: function(element) {
    var badge = Badge.fromElement(element);
    badge.owner = this;
    this.model.addBadge(badge);    
    return badge;
  },
  
  /**
   * Add a badge to this collection
   */
  addBadge: function(badge) {
    this.currentView.addBadgeElement(badge.currentView.$el);
  },
  
  /**
   * Add badge 'add to group' buttons (delegated to view)
   */
  addBadgePickers: function(group) {
    var badgeArea = group.currentView.$el.find(".badgeArea");
    this.currentView.addBadgePickers(group);
  },
  
  /**
   * Remove badge 'add to group' buttons (delegated to view)
   */
  removeBadgePickers: function() {
    this.currentView.removeBadgePickers();
  }  
};

// ensure correct constructor identifier
BadgeCollection.prototype.constructor = BadgeCollection;
