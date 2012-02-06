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
      <a href="{{detailsUrl}}" draggable="true" class="badge" id="{{attributes.body_hash}}" data-hash="{{attributes.body_hash}}" data-id="{{attributes.id}}">
        <img src="{{attributes.image_path}}" width="64px"/>
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
        <div class='group' data-badges="[{{attributes.badges}}]" data-id="{{attributes.id}}" id="{{attributes.url}}">
          <input class='groupName' type='text' value='{{attributes.name}}' style='display: block'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
          
          {{#attributes.badgeObjects}}
            <a href="{{detailsUrl}}" draggable="true" class="badge" id="{{attributes.body_hash}}-{{url}}" data-hash="{{attributes.body_hash}}" data-id="{{attributes.id}}" data-grouped="{{url}}">
              <img src="{{attributes.image_path}}" width="64px"/>
            </a>
          {{/attributes.badgeObjects}}
        </div>
      {{/groups}}
      
      <div class='group isNew'>
        <input class='groupName' type='text' value='New Group'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
        
        <h3 class='instructions'>Drag a Badge Here</h3>
      </div>
      
    </div>
  {{/badges.length}}
</div>


{{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these --->
<script type='text/html' id='groupTpl'>
  <div class='group {{^attributes.id}}isNew{{/attributes.id}}'>
    <input class='groupName' type='text' value='{{name}}'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
    
    {{^attributes.id}}
      <h3 class='instructions'>Drag a Badge Here</h3>
    {{/attributes.id}}
    
    {{#badges.length}}
      {{>badgeTemplate}}
    {{/badges.length}}
  </div>
</script>

<script type='text/html' class='partial' id='badgeTpl'>
  <a href="{{url}}" draggable="true" class="badge">
    <img src="{{image}}" width="64px"/>
  </a>
</script>
