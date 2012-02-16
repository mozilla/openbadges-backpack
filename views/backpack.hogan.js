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
        <a href="#" draggable="true" class="badge" data-id="{{attributes.id}}">
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
        <div class='group' data-id="{{attributes.id}}">
          <input class='groupName' type='text' value='{{attributes.name}}' style='display: block'>
        <span class='icon delete'>&times;</span>
        <span class='icon config'>&#x2699;</span>
          
          {{#attributes.badgeObjects}}
            <a href="#" draggable="true" class="badge" data-id="{{attributes.id}}">
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

<div class='lightbox'>
  <div class='contents badge-details'>
    <header>
      <h2>Awesome Badge of Awesomeitudiness</h2>
    </header>
    <div class='body'>
      
      <div class='confirm-disown'>
        <p>
          This will remove the badge from your account. It will also be
          removed from all groups. The only way to get this badge back will be
          to go to the place where it was issued (<a href='http://p2pu.org'>P2PU</a>)
          and get it re-issued.
        </p>
      
        <div class='buttons'>
          <button class='btn'>Nevermind, I want to keep this badge</button>
          <button class='btn danger'>Yes, remove this badge</button>
        </div>
      </div>
      
      <table class='information'>
        
        <tr>
          <td rowspan="100" class='image'>
            <img src="/_badges/6e20f188a75052fc5b6a573121e428fa.png">
            <button class='btn danger'>Disown this Badge</button>
          </td>
          
          <td class='section-head' colspan='2'>Issuer Details</td>
        </tr>
        <tr>
          <td class='label issuer-name'>Name</td>
          <td>P2PU</td>
        </tr>
        <tr>
          <td class='label issuer-name'>URL</td>
          <td><a href='http://p2pu.org'>http://p2pu.org</a></td>
        </tr>
        <tr>
          <td class='label issuer-name'>Organization</td>
          <td>School of Webcraft</td>
        </tr>
        
        <tr>
          <td class='section-head' colspan='2'>Badge Details</td>
        </tr>
        <tr>
          <td class='label'>Name</td>
          <td>Awesome Badge of Awesomeitudiness</td>
        </tr>
        <tr>
          <td class='label'>Description</td>
          <td>For keeping it real and rocking in the free world.</td>
        </tr>
        <tr>
          <td class='label'>Criteria</td>
          <td><a href='#'>http://example.com/awesome/</a></td>
        </tr>
        
        <tr>
          <td class='section-head' colspan='2'>Issuance Details</td>
        </tr>
        <tr>
          <td class='label recipient'>Recipient</td>
          <td>bimmy@example.com</td>
        </tr>
        <tr>
          <td class='label evidence'>Evidence</td>
          <td><a href='#'>http://example.com/what/</a></td>
        </tr>
        <tr>
          <td class='label'>Issued On</td>
          <td>January 1st, 2001</td>
        </tr>
        <tr>
          <td class='label'>Expiration Date</td>
          <td>January 1st, 2013</td>
        </tr>
      
      </table>
    </div>
  </div>
</div>




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
  <a href="{{url}}" draggable="true" class="badge">
    <img src="{{image}}" width="64px"/>
  </a>
</script>
