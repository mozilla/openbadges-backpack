/**
 * Group listing model
 */
GroupListingModel = Backbone.Model.extend({
  urlRoot: '/groups',
  defaults: {
    groups: []
  },
  /**
   * add a group to this listing model
   */
  addGroup: function(group) {
    this.get("groups").push(group);
  },
  /**
   * remove a group from this listing model
   */
  removeGroup: function(group) {
    var groups = this.get("groups");
    var pos = groups.indexOf(group);
    if(pos!==-1) {
      groups.splice(pos, 1);
    }
  }
});