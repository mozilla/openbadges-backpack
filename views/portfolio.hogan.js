{{#portfolio}}
<link rel="stylesheet" href="/css/socialmedia.css">

<div class='portfolio'>
{{#message}}
  <div class='message-container'>
    <div class="alert alert-info">
      <a class="close" data-dismiss="alert">×</a>
      {{{message}}}
      {{{socialcode}}}
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
            <colgroup>
              <col class="imageCol">
              <col class="fieldLabelCol">
              <col class="dataCol">
            </colgroup>
            <tbody>
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
            </tbody>
          </table>
        {{/body}}
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
