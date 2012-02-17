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
        <span draggable="true" class="badge" data-id="{{attributes.id}}">
          <img src="{{attributes.image_path}}" width="64px"/>
        </span>
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
        <div class='group' data-id="{{attributes.id}}">
          <input class='groupName' type='text' value='{{attributes.name}}' style='display: block'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
          
          {{#attributes.badgeObjects}}
            <span draggable="true" class="badge" data-id="{{attributes.id}}">
              <img src="{{attributes.image_path}}" width="64px"/>
            </span>
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

<script>
  window.badgeData = {}
  {{#badges}}
    window.badgeData[{{attributes.id}}] = {{{serializedAttributes}}};
  {{/badges}}
</script>

{{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these --->

<script type='text/html' id='detailsTpl'>
  <div class='lightbox' data-id='{{id}}'>
    <div class='contents badge-details'>
      <header>
        <h2>{{body.badge.name}}</h2>
        <span class='close'>&times;</span>
      </header>
      <div class='body'>

        <div class='confirm-disown'>
          <p>
            This will remove the badge from your account. It will also be
            removed from all groups. The only way to get this badge back will be
            to go to the place where it was issued
            (<a href='{{body.badge.issuer.origin}}'>{{body.badge.issuer.name}}</a>)
            and get it re-issued.
          </p>

          <div class='buttons'>
            <button class='btn nope'>Nevermind, I want to keep this badge</button>
            <button class='btn yep danger'>Yes, remove this badge</button>
          </div>
        </div>

        <table class='information'>
          <tr>
            <td rowspan="100" class='image'>
              <img src="{{image_path}}" class='badge-image'>
              <button class='btn danger disown'>Disown this Badge</button>
            </td>

            <td class='section-head' colspan='2'>Issuer Details</td>
          </tr>
          {{#body}}
          <tr>
            <td class='label issuer-name'>Name</td>
            <td>{{badge.issuer.name}}</td>
          </tr>
          <tr>
            <td class='label issuer-name'>URL</td>
            <td><a href={{badge.issuer.origin}}'>{{badge.issuer.origin}}</a></td>
          </tr>
          {{#badge.issuer.org}}
          <tr>
            <td class='label issuer-name'>Organization</td>
            <td>{{badge.issuer.org}}</td>
          </tr>
          {{/badge.issuer.org}}

          <tr>
            <td class='section-head' colspan='2'>Badge Details</td>
          </tr>
          <tr>
            <td class='label'>Name</td>
            <td>{{badge.name}}</td>
          </tr>
          <tr>
            <td class='label'>Description</td>
            <td>{{badge.description}}</td>
          </tr>
          <tr>
            <td class='label'>Criteria</td>
            <td><a href='{{badge.criteria}}'>{{badge.criteria}}</a></td>
          </tr>

          <tr>
            <td class='section-head' colspan='2'>Issuance Details</td>
          </tr>
          <tr>
            <td class='label recipient'>Recipient</td>
            <td>{{recipient}}</td>
          </tr>
          <tr>
            <td class='label evidence'>Evidence</td>
            <td><a href='{{evidence}}'>{{evidence}}</a></td>
          </tr>
          {{#issued_on}}
          <tr>
            <td class='label'>Issued On</td>
            <td>{{issued_on}}</td>
          </tr>
          {{/issued_on}}
          
          {{#expires}}
          <tr>
            <td class='label'>Expiration Date</td>
            <td>{{expires}}</td>
          </tr>
          {{/expires}}
          
          {{/body}}
        </table>
      </div>
    </div>
  </div>
</script>



<script type='text/html' id='groupTpl'>
  <div class='group {{^attributes.id}}isNew{{/attributes.id}}'>
    <input class='groupName' type='text' value='{{name}}'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
    
    {{^attributes.id}}
      <h3 class='instructions'>Drag a Badge Here</h3>
    {{/attributes.id}}
  </div>
</script>

<script type='text/html' class='partial' id='badgeTpl'>
  <span draggable="true" class="badge">
    <img src="{{image_path}}" width="64px"/>
  </span>
</script>
