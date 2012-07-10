<h1>Backpack Facts</h1>

{{#stats}}
<p>There's {{totalBadges}} badges in the system.</p>
<p>Some details per issuer,
  <ul>
    {{#totalPerIssuer}}
    <li>{{name}} has {{total}} badges</li>
    {{/totalPerIssuer}}
  </ul>
</p>
{{/stats}}

