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
//    console.log("saving model...");

    var sucFn = (function(model, callback) {
      return function() {
//        console.log("saving succeeded");
        model.set("pending",false);
        if(callback) callback();
      }
    }(this, callback));

    var errFn = (function(model, callback) {
      return function() {
//        console.log("saving failed!");
        if(callback) callback();
      }
    }(this, callback));

    if (this.get("pending")) {
//      console.log("CREATE: backbone will update the model with the new values for us");
      this.save(null, { success : sucFn, error: errFn });
    } else {
//      console.log("UPDATE: updating the server-side model");
      this.save(null, { success : sucFn, error: errFn });
    }
  },

  /**
   * Destroy this model: send a DELETE
   */
  destroyModel: function() {
//    console.log("destroying model...");
    if(this.get("pending")) {
//      console.log("model had not been saved on the server. Simply discarding.");
    } else {
//      console.log("DELETE: we never want to see this group again");
      this.destroy();
    }
  },
  
  /**
   * Add a badge id to this group's list of contained badges.
   */
  addBadge: function(badgeId) {
    var badges = this.get("badges");
//    console.log("trying to add "+badgeId+" into ",badges);
    if(badges.indexOf(badgeId)===-1) {
//      console.log("adding badgeId "+badgeId+" to group model");
      badges.push(badgeId);
    }
//    console.log("list after adding: "+badges);
  },

  /**
   * Remove a badge id from this group's list of contained badges.
   */
  removeBadge: function(badgeId) {
    var badges = this.get("badges"),
        pos = badges.indexOf(badgeId);
//    console.log("trying to remove "+badgeId+" (pos: "+pos+") from ",badges);
    if(pos!==-1) {
//      console.log("removing badgeId "+badgeId+" from group model");
      badges.splice(pos,1);
    }
//    console.log("list after removing: "+badges);
  },
  
  /**
   * Get the list of badges
   */
  getBadgeList: function() {
    return this.get("badges");
  },
  
  /**
   * Do we have this badge?
   */
  hasBadge: function(badgeId) {
    return this.get("badges").indexOf(badgeId) !== -1;
  }
});