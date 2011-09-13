if @error.length
  div '.alert-message.error.js-alert-container', ->
    a '.close.js-alert-close', href: '#', -> 'x'
    p ->
      strong -> "Oh no!"
      text @error[0]

h1 -> 'Welcome'
h2 -> """
  Use the green button in the upper right to sign in. Don&rsquo;t worry if you
  don&rsquo;t have an account, that&rsquo;ll get taken care of.
"""
