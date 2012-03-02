{{#tooltips}}
<div class="alert alert-block alert-info">
  <h4 class="alert-heading">Welcome to your Badge Backpack!</h4>
  <p>
    You collect badges here from various issuers and learning experiences. In fact, you can see the badge(s) you just earned here.
  </p>
  <p>
    We've turned on some helpful tooltips to help you get oriented. Mouse over the different parts of your backpack to learn what they do, paying special attention anywhere you see the <i class="icon-info-sign"></i> icon.
  </p>
  <p>
    When you feel comfortable you can click the <a href="{{#reverse}}backpack.manage{{/reverse}}">Help: Off</a> link here or above to toggle these messages off.
  </p>
</div>
{{/tooltips}}

{{^badges.length}}
<h1>No badges.  Better get out there and start earning some!</h1>
<p>By the way, <a href="http://p2pu.org">P2PU</a> would be a great place to start
{{/badges.length}}

<div class="row" style="position: relative;">
  <div class="span-one-third column">
    {{#badges.length}}
    <h1><span data-title="Badges" data-content="These are the badges you've earned so far! Click on one to see its details." rel="popover">Badges{{#tooltips}}<i class="icon-info-sign"></i>{{/tooltips}}</span></h1>
    <div id="badges" class="js-badges">
      {{#badges}}
        <span draggable="true" class="badge" data-id="{{attributes.id}}">
          <img src="{{attributes.image_path}}" width="64px"/>
        </span>
      {{/badges}}
    </div>
    {{/badges.length}}
    
    <div class="upload">
      <h4><span data-title="Upload Badges" data-content="You can upload previously earned badges here, but they have to comply with the OBI metadata spec." rel="popover">Upload Badges{{#tooltips}}<i class="icon-info-sign"></i>{{/tooltips}}</span></h4>
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
      <h1><span rel="popover" data-title="Groups" data-content="You can drag-and-drop badges into groups, which you can use to publish your badges for employers, social networks, etc.">Groups{{#tooltips}}<i class="icon-info-sign"></i>{{/tooltips}}</span></h1>
      {{#groups}}
        <div class='group' data-id="{{attributes.id}}" data-url="{{attributes.url}}">
        <input class='groupName' type='text' value='{{attributes.name}}' style='display: block' rel="tooltip" data-title="Rename groups to whatever you want!">
        <span class='icon delete' rel="tooltip" data-title="Click to delete this group">&times;</span>
        <span class='icon share' rel="tooltip" data-placement="bottom" {{^attributes.badgeObjects}}style='display: none'{{/attributes.badgeObjects}} title='Share this group'>5</span>
          
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
        <span class='icon share' title='share this group'>5</span>
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

{{#tooltips}}
<script>
  $(function(){
    $('[rel="popover"]').popover({
      animation: false,
      placement: 'right'
    });
    $('[rel="tooltip"]').tooltip({
      animation: false
    });
  });
</script>
{{/tooltips}}

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
          <span class='icon share' style='display: none' title='share this group'>5</span>
    
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
