<h1>Backpack Facts</h1>

{{#stats}}
<p>There's {{total_badges}} badges in the system.</p>
<p>Some details per issuer,
  <ul>
    {{#total_per_issuer}}
    <li>{{name}} has {{total}} badges</li>
    {{/total_per_issuer}}
  </ul>
</p>
{{/stats}}

