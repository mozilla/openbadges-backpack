<h1>Backpack Facts</h1>

{{#stats}}
<p>There are {{totalBadges}} badges in the system.</p>
<p>Some details per issuer,
  <ul>
    {{#totalPerIssuer}}
    <li>{{name}} (<a href='{{url}}'>{{url}}</a>) has {{total}} badges</li>
    {{/totalPerIssuer}}
  </ul>
</p>
{{/stats}}

