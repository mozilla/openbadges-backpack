/**
 * Badge collection model
 */
BadgeCollectionModel = Backbone.Model.extend({
  urlRoot: '/collections',
  defaults: {
    badges: []
  },
  /**
   * add a basge to this collection model
   */
  addBadge: function(badge) {
    this.get("badges").push(badge);
  },
  /**
   * remove a badge from this collection
   */
  removeBadge: function(badge) {
    var badges = this.get("badges");
    var pos = badges.indexOf(badge);
    if(pos!==-1) {
      badges.splice(pos, 1);
    }
  }
});