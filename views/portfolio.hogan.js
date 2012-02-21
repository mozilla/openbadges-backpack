<div class='portfolio'>
  <header>
    {{#title}}<h1>{{title}}</h1>{{/title}}
    {{#subtitle}}<h2>{{subtitle}}</h1>{{/subtitle}}
  </header>

  {{#preamble}}
  <section class='preamble'>
    <p>{{{ preamble }}}</p>
  </section>
  {{/preamble}}

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
              <td class='label'>Issued</td>
              <td>{{issued_on}}</td>
            </tr>
            {{/issued_on}}

            {{#expires}}
            <tr>
              <td class='label'>Expiration</td>
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
