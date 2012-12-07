/**
 * Badge object representation - constructor
 */
var Badge = function(name, id, description, image_path, issuerName) {
  // set up the model for this group
  var badgeModel;
  if(name && id && description && image_path && issuerName) {
    badgeModel = new BadgeModel({
      name: name,
      id: id,
      description: description,
      image_path: image_path,
      issuer: { name: issuerName }
    });
  } else {
    badgeModel = new BadgeModel();
  }
  this.setModel(badgeModel);
};

/**
 * Group object representation - 'copy' constructor
 *
 * @param {HTMLElement} element that acts as construction template
 */
Badge.fromElement = function (element) {
  var $el = $(element),
      name = $el.data("original-title"),
      id = $el.data("id"),
      description = $el.data("description"),
      image_path = $el.data("image-path"),
      issuerName = $el.data("issuer-name");
  var badge = new Badge(name, id, description, image_path, issuerName);
  $el.replaceWith(badge.currentView.$el);
  return badge;
};

/**
 * Group object representation - prototype
 */
Badge.prototype = {

  // owning GroupListing object
  owner: null,

  // local model and views (filled by constructor)
  model: null,
  views: null,

  // "this is what it looks like now" reference
  currentView: null,

  /**
   * Set the model for this group
   */
  setModel: function(badgeModel) {
    this.model = badgeModel;
    badgeModel.controller = this;
    this.views =  {
      entry: new BadgeView({model: badgeModel})
    };
    this.currentView = this.views.entry;
    this.render();
  },

  /**
   * Render this group (delegated to current view)
   */
  render: function() {
    return this.currentView.render(this.model);
  }
};

// ensure correct constructor identifier
Badge.prototype.constructor = Badge;
