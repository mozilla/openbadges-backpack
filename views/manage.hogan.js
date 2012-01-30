{{^badges.length}}
<h1>No badges.  Better get out there and start earning some!</h1>
<p>By the way, <a href="http://p2pu.org">P2PU</a> would be a great place to start
{{/badges.length}}

<div class="row">
  <div class="span-one-third column">
    {{#badges.length}}
    <h1>Badges</h1>
    <div id="badges" class="js-badges">
      {{#badges}}
      <a href="{{detailsUrl}}">
        <img id="id.{{data.id}}" src="{{data.image_path}}" width="64px"/>
      </a>
      {{/badges}}
    </div>
    {{/badges.length}}
    
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

  {{#badges.length}}
    <div class="span-two-thirds column groups">
      <h1>Groups</h1>
      {{^user.groups.length}}
      <h2>
        You haven't made any groups yet.<br/>
        <form action='' method='post'>
          <input class='btn primary' type='submit' value="Create a new group">
        </form>
      </h2>
      {{/user.groups.length}}
      {{#user.groups}}
      <h3>{{name}}</h3>
      <div class="well" style="position:relative">
        <!-- todo - pull this from coffee -->
      </div>
      {{/user.groups}}
    </div>
  {{/badges.length}}

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
