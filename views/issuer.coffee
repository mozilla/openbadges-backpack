form action: @reverse('test.award'), method: 'post', ->
  input type: 'hidden', name: '_csrf', value: @csrfToken
  fieldset ->
    div '.clearfix', ->
      label for: 'recp', -> 'Recipient'
      div '.input', -> input "#recp", type: 'text', name: 'recp'

    div '.clearfix', ->
      label for: 'image', -> 'Image Url'
      div '.input', -> input "#image", type: 'text', name: 'image'

    div '.input', ->
      input '.btn.primary', type: 'submit', value: 'Award badge'
