<h1>{{type.name}}</h1>
<div class="row">
  <div class="span-one-third columns badge-details">
    <img id="badge-image" src="{{image}}" alt="Badge Image"/>
    <dl>
      <dt>Recipient</dt>
      <dd>{{recipient}}</dd>

      <dt>Name</dt>
      <dd>{{type.name}}</dd>

      <dt>Description</dt>
      <dd>{{type.description}}</dd>

      <dt>Criteria</dt>
      <dd><a href="{{type.criteria}}">{{type.criteria}}</a></dd>

      <dt>Issuer</dt>
      <dd>{{type.issuer.name}} (<a href="{{type.issuer.origin}}">{{type.issuer.origin}}</a>)</dd>

      {{#type.issuer.org}}
      <dt>Organization</dt>
      <dd> {{type.issuer.org}} </dd>
      {{/type.issuer.org}}
    </dl>
  </div>

  {{#owner}}
  <div class="span-two-thirds columns management">

    <div class="accept-reject">
      <h2>Keep this badge?</h2>
      <form action="{{ deleteRoute }}" method="post" style="display: inline">
        <input type="hidden" name="_csrf" value="{{ csrfToken }}"></input>
        <input type="hidden" name="_method" value="delete"></input>
        <input class="btn danger" type="submit" value="No, delete this badge."></input>
      </form>
    </div>
  </div>
  {{/owner}}
</div>

<script type="text/javascript">
(function() {

  coffeescript(function() {
    var autocheck, checkboxes, newGroup, shortDisable, watchChanges;
    newGroup = $('#new-group');
    checkboxes = $('.input-append input[type=checkbox]');
    watchChanges = function(event) {
      var elem, input, label;
      elem = $(this);
      label = elem.parent();
      input = label.siblings('input').first();
      if (elem.attr('checked')) {
        label.addClass('active');
        if (!input.val()) return input.trigger('focus');
      } else {
        return label.removeClass('active');
      }
    };
    autocheck = function(event) {
      var checkbox, checked, elem;
      elem = $(this);
      checkbox = elem.siblings('label').first().find('input');
      checked = elem.val() ? true : false;
      return checkbox.attr('checked', checked).trigger('change');
    };
    shortDisable = function() {
      var checkbox, elem;
      elem = $(this);
      checkbox = elem.siblings('label').first().find('input');
      checkbox.attr('disabled', true);
      return setTimeout(function() {
        return checkbox.attr('disabled', false);
      }, 20);
    };
    checkboxes.bind('change', watchChanges).trigger('change');
    return newGroup.bind('keydown', autocheck).bind('blur', autocheck).bind('blur', shortDisable);
  });
</script>
<script>
(function() {

  coffeescript(function() {
    var image;
    image = $('#badge-image');
    return image.bind('load', function(event) {
      if (this.clientWidth > 256) {
        return $(this).css({
          width: '256px'
        });
      }
    });
  });

}).call(this);
</script>
