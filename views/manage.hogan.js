{{^badges.length}}
<h1>No badges.  Better get out there and start earning some!</h1>
<p>By the way, <a href="http://p2pu.org">P2PU</a> would be a great place to start
{{/badges.length}}

<div class="row">
  <div class="span-one-third column">
    <h1>Badges</h1>

    {{#badges.length}}

    {{#badges.pending.length}}
    <h3>Pending</h3>
    <div id="pending-badges" class="js-badges">
      {{#badges.pending}}
      {{> badges_partial}}
      {{/badges.pending}}
    </div>
    {{/badges.pending.length}}

    {{#badges.accepted.length}}
    <h3>Accepted</h3>
    <div id="accepted-badges" class="js-badges">
      {{#badges.accepted}}
      {{> badges_partial}}
      {{/badges.accepted}}
    </div>
    {{/badges.accepted.length}}

    {{#badges.rejected.length}}
    <h3>Rejected</h3>
    <div id="rejected-badges" class="js-badges">
      {{#badges.rejected}}
      {{ > badges_partial}}
      {{/badges.rejected}}
    </div>
    {{/badges.rejected.length}}
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

  <div class="span-two-thirds column groups">
    <h1>Groups</h1>
    {{^user.groups.length}}
    <h2>You haven't made any groups yet.</h2>
    {{/user.groups.length}}
    {{#user.groups}}
    <h3>{{name}}</h3>
    <div class="well" style="position:relative">
      p
    </div>
    {{/user.groups}}
  </div>
</div>
