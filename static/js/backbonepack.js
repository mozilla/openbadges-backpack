ich.refresh();

var Group = Backbone.Model.extend({
  defaults: {
    title: "New Group",
    badges: Array(),
    "public": false
  }
});

var Badge = Backbone.Model.extend({});

var Groups = Backbone.Collection.extend({
  url: '/collection'
});

var Badges = Backbone.Collection.extend({
  url: '/badge'
});

var GroupView = Backbone.View.extend({
  parent: $('.groups'),
  
  tagName: "div",
  
  className: "group",
  
  events: {
    "click" : "rad"
  },

  render: function () {
    console.dir(this.model);
    this.el = ich.group(this.model);
    this.$el = $(this.el);
    this.$el
      .hide()
      .appendTo(this.parent)
      .fadeIn()
  },

  rad : function () {
    console.log('cool');
  }
})

var gR = new GroupView({
  model: new Group({name: 'oh sup'})
})

gR.render();










!!function browserId() {
  function launchBrowserId(callback) {
    return function() { navigator.id.getVerifiedEmail(callback); }
  }
  function handleResponse(assertion) {
    if (!assertion) return false;
    $('.js-browserid-input').val(assertion);
    $('.js-browserid-form').trigger('submit');
  }
  $('.js-browserid-link').bind('click', launchBrowserId(handleResponse));
}()
