form '#bake-form.baker.form-stacked', action: @reverse('baker.baker'), method:'GET', ->
  fieldset ->
    label for: 'assertion', -> "URL for your badge assertion"
    input '#assertion.xlarge', name: 'assertion', type: 'text', placeholder: 'http://your-site.com/path-to-assertion.json', value: 'http://badgehub.org/test/badge.json'
  fieldset ->
    input '#submit.large.btn.primary', type: 'submit', value: 'Build this badge'

div '#result', ->
script type: "text/javascript", src: "/js/formatter.js"
script type: "text/javascript", src: "/js/baker.js"
