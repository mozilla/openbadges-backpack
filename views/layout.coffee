doctype 5
html ->
  head ->
    meta charset: 'utf-8'
    meta 'http-equiv': 'X-UA-Compatible', content: 'IE=edge;chrome=1'
    meta name: 'viewport', content: 'width=device-width, initial-scale=1.0'
    link rel: "stylesheet", href: '/css/bootstrap-1.2.0.min.css'
    link rel: 'stylesheet', href: '/css/style.css', type: 'text/css', media: 'all'
    title dir:'ltr' ,-> "Open Badge #{@title}"
    script type: 'text/javascript', src: 'https://browserid.org/include.js'
    script type: 'text/javascript', src: 'http://ajax.googleapis.com/ajax/libs/jquery/1.6.2/jquery.min.js'
    script type: "text/javascript", src: '/js/modernizr.js'
  body ->
    div '.topbar' ,->
      div '.topbar-inner' ,->
        div '.container', style: 'position: relative;', ->
          h3 -> a href: '#', -> "Open Badge #{@title}"
          a '#moztab', href: 'http://mozilla.org', -> 'a mozilla.org joint'
          if @user
            ul '.nav', ->
              li -> a href: @reverse 'backpack.manage', -> 'Home'
              li -> a href: @reverse 'backpack.signout', -> 'Sign Out'

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
    div '.blanker', ->
    div '.modal', style: 'position: relative, top: auto, left: auto, margin: 0 auto; z-index: 10', ->
      div '.modal-header', ->
        h3 ->
        a '.close', href: '#', -> '×'
      div '.modal-body', ->
        p ->
      div '.modal-footer', ->
        a '.btn.primary', href: '#', -> 'Okay'


    script type: 'text/javascript', src: '/js/backpack.js'

coffeescript ->
  window.modal =
    main: $('.modal')
    blanker: $('.blanker')
    close: $('.modal a.close')
    button: $('.modal a.btn')
    title: $('.modal-header h3')
    body: $('.modal-body')
    hide: ->
      modal.main.fadeOut()
      modal.blanker.fadeOut()
    show: (title, body) ->
      modal.title.html(title)
      modal.body.html(body)
      modal.main.fadeIn()
      modal.blanker.fadeIn()
      modal
    setup: ->
      modal.close.bind 'click', modal.hide
      modal.blanker.bind 'click', modal.hide
      modal.button.bind 'click', modal.hide
      $('body').bind 'keyup', (e) -> console.log(e); if e.keyCode is 27 then modal.hide()
      modal

  modal.setup()
