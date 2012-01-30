{{^badges.total}}
<h1>No badges.  Better get out there and start earning some!</h1>
<p>By the way, <a href="http://p2pu.org">P2PU</a> would be a great place to start
{{/badges.total}}

<div class="row">
  <div class="span-one-third column">
    {{#badges.total}}
    <h1>Badges</h1>

    {{#badges.pending.length}}
    <h3>Pending</h3>
    <div id="pending-badges" class="js-badges">
      {{#badges.pending}}
      <a href="{{#reverse}}backpack.details, {'badgeId': {{id}} }{{/reverse}}">
        <img id="id.{{id}}" src="{{meta.imagePath}}" width="64px"/>
      </a>
      {{/badges.pending}}
    </div>
    {{/badges.pending.length}}

    {{#badges.accepted.length}}
    <h3>Accepted</h3>
    <div id="accepted-badges" class="js-badges">
      {{#badges.accepted}}
      <a href="{{#reverse}}backpack.details, {'badgeId': {{id}} }{{/reverse}}">
        <img id="id.{{id}}" src="{{meta.imagePath}}" width="64px"/>
      </a>
      {{/badges.accepted}}
    </div>
    {{/badges.accepted.length}}

    {{#badges.rejected.length}}
    <h3>Rejected</h3>
    <div id="rejected-badges" class="js-badges">
      {{#badges.rejected}}
      <a href="{{#reverse}}backpack.details, {'badgeId': {{id}} }{{/reverse}}">
        <img id="id.{{id}}" src="{{meta.imagePath}}" width="64px"/>
      </a>
      {{/badges.rejected}}
    </div>
    {{/badges.rejected.length}}
    {{/badges.total}}
    
    <div class="upload">
      <h4>Upload Badges</h4>
      <p>If you have badges you've been awarded, you can upload them manually</p>
      <form action="{{#reverse}}backpack.upload{{/reverse}}" method="post" enctype="multipart/form-data">
        <fieldset>
          <div class="clearfix">
            <input type="hidden" name="csrf" value="{{csrf}}"></input>
            <input id="userBadge" type="file" name="userBadge" accept="image/png"></input>
          </div>
        </fieldset>
        <div class="clearfix">
          <input class="btn primary" type="submit" value="Upload"></input>
        </div>
      </form>
    </div>
  </div>

  <div class="span-two-thirds column groups">
    <h1>Groups</h1>
    {{^user.groups.length}}
    <h2>You haven't made any groups yet.</h2>
    {{/user.groups.length}}
    {{#user.groups}}
    <h3>{{name}}</h3>
    <div class="well" style="position:relative">
      <!-- todo - pull this from coffee -->
    </div>
    {{/user.groups}}
  </div>
  <script type="text/javascript">
    (function() {
    coffeescript(function() {
    return $('.embed').bind('click', function(event) {
      var script, self;
      self = $(this);
      script = self.siblings('input').first().val();
      modal.show('Copy and paste this into a web page', "<div><textarea style='width:98%'; height:75px'>" + script + "</textarea></div>");
      return false;
    });
  });
}).call(this);
</script>

</div>
