h1 -> 'Welcome'
h2 ->
  text 'Use the green button below to '
  a '.js-browserid-link', href: '#', -> 'sign in.'
  br ->
  text ' Don&rsquo;t worry if you don&rsquo;t have an account, that&rsquo;ll get taken care of.'

form '.signin.js-browserid-form', method: 'POST', action: @reverse 'backpack.authenticate', ->
  input '.js-browserid-input', name: 'assertion', type: 'hidden'
  input name: 'csrf', type: 'hidden', value: @csrf

div style: 'padding-top: 10px', ->
  a '.js-browserid-link', href: '#', ->
    img src: 'https://browserid.org/i/sign_in_green.png'
