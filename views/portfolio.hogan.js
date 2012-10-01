{{#portfolio}}

<div class='portfolio'>
{{#message}}
  <div class='message-container'>
    <div class="alert alert-info">
      <a class="close" data-dismiss="alert">×</a>
      {{{message}}}
    </div>
  </div>
{{/message}}

  {{#owner}}
  <div class='edit'>
    <a href="edit" class='edit btn btn-primary'>Edit this page</a>
  </div>
  {{/owner}}

  <header>
    {{#attributes.title}}<h1>{{attributes.title}}</h1>{{/attributes.title}}
    {{#attributes.subtitle}}<h2>{{attributes.subtitle}}</h1>{{/attributes.subtitle}}
  </header>

  {{#attributes.preamble}}
  <section class='preamble'>
    <p>{{ attributes.preamble }}</p>
  </section>
  {{/attributes.preamble}}

  <ul class='badges'>
    {{#badges}}
      {{#attributes}}
        <li>
          {{#body}}
          <h3>{{badge.name}}</h3>

          <p class='story'>{{_userStory}}</p>

          <table class='information'>
            <tr>
              <td rowspan="100" class='image'>
                <img src="{{image_path}}">
              </td>

              <td class='section-head' colspan='2'>Issuer Details</td>
            </tr>
            <tr>
              <td class='fieldlabel issuer-name'>Name</td>
              <td>{{badge.issuer.name}}</td>
            </tr>
            <tr>
              <td class='fieldlabel issuer-name'>URL</td>
              <td><a href="{{badge.issuer.origin}}">{{badge.issuer.origin}}</a></td>
            </tr>
            {{#badge.issuer.org}}
            <tr>
              <td class='fieldlabel issuer-name'>Organization</td>
              <td>{{badge.issuer.org}}</td>
            </tr>
            {{/badge.issuer.org}}

            <tr>
              <td class='section-head' colspan='2'>Badge Details</td>
            </tr>
            <tr>
              <td class='fieldlabel'>Name</td>
              <td>{{badge.name}}</td>
            </tr>
            <tr>
              <td class='fieldlabel'>Description</td>
              <td>{{badge.description}}</td>
            </tr>
            <tr>
              <td class='fieldlabel'>Criteria</td>
              <td><a href='{{badge.criteria}}'>{{badge.criteria}}</a></td>
            </tr>

            {{#evidence}}
            <tr>
              <td class='fieldlabel evidence'>Evidence</td>
              <td><a href='{{evidence}}'>{{evidence}}</a></td>
            </tr>
            {{/evidence}}

            {{#issued_on}}
            <tr>
              <td class='fieldlabel'>Issued</td>
              <td>{{issued_on}}</td>
            </tr>
            {{/issued_on}}

            {{#expires}}
            <tr>
              <td class='fieldlabel'>Expiration</td>
              <td>{{expires}}</td>
            </tr>
            {{/expires}}

            {{/body}}
          </table>
        </li>
      {{/attributes}}
    {{/badges}}
  </ul>

  {{#postamble}}
  <section class='postamble'>
    {{postamble}}
  </section>
  {{/postamble}}
</div>

{{/portfolio}}


<style>
  .socialshare {
    opacity: 0.8;
    text-shadow: 2px 2px 4px rgba(0, 200, 160, 0.2);
    font-family: "Helvetica Neue",Helvetica,Arial,sans-serif;
  }

  .socialshare:focus {
    outline: 0;
  }
  
  .socialshare span {
    cursor: pointer;
  }

  .social-medium {
    display: table-cell;
    vertical-align: top;
    height: 20px;
  }

  .social-medium + .social-medium {
    padding-left: 1em;
  }

  .social-medium iframe {
    height: 20px;
    box-shadow: 4px 4px 3px rgba(100, 190, 180, 0.3);
    background-color: rgba(100, 190, 180, 0.3);
  }
</style>

{{=|| ||=}} <!-- need to change delimeter so hogan doesn't parse these --->

<script type="text/javascript" src="/js/social-media.js"></script>

<script>
function injectSocialMedia(container) {
  // prevent this element from injecting social media again
  container.onclick = function() { return false; }
  var socialMedia = new SocialMedia();
  var url = window.location.toString();

  // inject twitter, g+ and facebook
  socialMedia.hotLoad(container.querySelector(".twitter"),  socialMedia.twitter,  url);
  socialMedia.hotLoad(container.querySelector(".google"),   socialMedia.google,   url);
  socialMedia.hotLoad(container.querySelector(".facebook"), socialMedia.facebook, url);

  // kill off the text label
  var label = container.querySelector("span");
  $(label).remove();
}
</script>
