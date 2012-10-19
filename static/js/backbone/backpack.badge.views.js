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
BadgeView = Backbone.View.extend({
  parent: $('.collection .set'),

  /**
   * Render this view to the page
   */
  render: function() {
    var values = this.model.toBadgeAttributes(),
        html = env.render('Backpack.Badge.View.html', values);
    this.setElement($(html));
    this.setupUX();
    return this;
  },
  
  /**
   * Set up the UX for this view's element(s),
   * tied to a specific controller for the logic.
   */
  setupUX: function() {
    // code goes here
  }
});
