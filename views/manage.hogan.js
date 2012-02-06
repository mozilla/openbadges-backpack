{{^badges.length}}
<h1>No badges.  Better get out there and start earning some!</h1>
<p>By the way, <a href="http://p2pu.org">P2PU</a> would be a great place to start
{{/badges.length}}

<div class="row" style="position: relative;">
  <div class="span-one-third column">
    {{#badges.length}}
    <h1>Badges</h1>
    <div id="badges" class="js-badges">
      {{#badges}}
      <a href="{{detailsUrl}}" draggable="true" class="badge" id="{{data.body_hash}}" data-hash="{{data.body_hash}}" data-id="{{data.id}}">
        <img src="{{data.image_path}}" width="64px"/>
      </a>
      {{/badges}}
    </div>
    {{/badges.length}}
    
    <div class="upload">
      <h4>Upload Badges</h4>
      <p>If you have badges you've been awarded, you can upload them manually</p>
      <form action="{{#reverse}}backpack.userBadgeUpload{{/reverse}}" method="post" enctype="multipart/form-data">
        <fieldset>
          <div class="clearfix">
            <input type="hidden" name="_csrf" value="{{ csrfToken }}"></input>
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
    <div id='groups' class="span-two-thirds column">
      <h1>Groups</h1>
      {{#groups}}
        <div class='group' data-badges="[{{data.badges}}]" data-id="{{data.id}}" id="{{data.url}}">
          <input class='groupName' type='text' value='{{data.name}}' style='display: block'>
          {{#data.badgeObjs}}
            <a href="{{detailsUrl}}" draggable="true" class="badge" id="{{data.body_hash}}-{{url}}" data-hash="{{data.body_hash}}" data-id="{{data.id}}" data-grouped="{{url}}">
              <img src="{{data.image_path}}" width="64px"/>
            </a>
          {{/data.badgeObjs}}
        </div>
      {{/groups}}
      <div class='group new'>
        <input class='groupName' type='text' value='New Group'>
        <h3 class='instructions'>Drag a Badge Here</h3>
      </div>
      
    </div>
  {{/badges.length}}
</div>


{{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these --->
<script type='text/html' id='groupTpl'>
  <div class='group'>
    <input class='groupName' type='text' value='{{name}}' {{#attributes.id}}style='display: block'{{/attributes.id}}>
    
    {{^attributes.id}}
      <h3 class=instructions'>Drag a Badge Here</h3>
    {{/attributes.id}}
    
    {{#badges}}
      {{>badgeTemplate}}
    {{/badges}}
  </div>
</script>

<script type='text/html' class='partial' id='badgeTpl'>
  <a href="{{url}}" draggable="true" class="badge">
    <img src="{{image}}" width="64px"/>
  </a>
</script>
