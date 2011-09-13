doctype 5
html ->
  head ->
    meta charset: 'utf-8'
    meta 'http-equiv': 'X-UA-Compatible', content: 'IE=edge;chrome=1'
    meta name: 'viewport', content: 'width=device-width, initial-scale=1.0'
    link rel: "stylesheet", href: 'http://twitter.github.com/bootstrap/assets/css/bootstrap-1.2.0.min.css'
    link rel: 'stylesheet', href: '/css/style.css', type: 'text/css', media: 'all'
    title dir:'ltr' ,-> "Open Badge #{@title}"
    script type: 'text/javascript', src: 'https://browserid.org/include.js'
    script type: 'text/javascript', src: 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js'
    script type: "text/javascript", src: '/js/modernizr.js'
  body ->
    div '.topbar' ,->
      div '.topbar-inner' ,->
        div '.container' ,->
          h3 -> a href: '#', -> "Open Badge #{@title}"
          if @login
            if @user
              # form -> input type: 'text', placeholder: 'Filter'
              ul '.nav.secondary-nav', ->
                li '.menu', ->
                  a '.menu.js-usermenu-link', href: '#', -> @user
                  ul '.menu-dropdown.js-usermenu-dropdown', ->
                    li -> a href: @reverse 'backpack.signout', -> 'Sign Out'
            else
              form '.signin.js-browserid-form', method: 'POST', action: @reverse 'backpack.authenticate', ->
                input '.js-browserid-input', name: 'assertion', type: 'hidden'
                input name: 'csrf', type: 'hidden', value: @csrf
              ul '.nav.secondary-nav',  ->
                li -> a '.js-browserid-link', href: '#', ->
                  img src: 'https://browserid.org/i/sign_in_green.png'

    div '#body.container' ,->
      if @error.length
        div '.alert-message.error.js-alert-container', ->
          a '.close.js-alert-close', href: '#', -> 'x'
          p ->
            strong -> "Oh no! "
            text @error[0]

      if @success.length
        div '.alert-message.success.js-alert-container', ->
          a '.close.js-alert-close', href: '#', -> 'x'
          p ->
            strong -> "Yay! "
            text @success[0]

      text @body
      script type: 'text/javascript', src: '/js/backpack.js'

