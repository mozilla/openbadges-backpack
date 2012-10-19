/**
 * Individual badge model
 */
BadgeModel = Backbone.Model.extend({
  urlRoot: '/badge',

  defaults: {
    name: "badge name",
    description: "bade description",
    id: -1,
    image_path: "/image/path.png",
    issuer: {
      name: "issuer name"
    }
  },

  /**
   * Form a server-side compatible object representation.
   * (since the same templates are used by the server and the client)
   */
  toBadgeAttributes: function() {
    var json = this.toJSON()
    return {
      badge: {
        attributes: {
          id: json.id,
          image_path: json.image_path,
          body: {
            badge: {
              name: json.name,
              description: json.description,
              issuer: {
                name: json.issuer.name
              }}}}}};
  }
  
  // Badges cannot be modified by the client
});