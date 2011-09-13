if @error.length
  div '.alert-message.error.js-alert-container', ->
    a '.close.js-alert-close', href: '#', -> 'x'
    p -> error

if not @badges?
  h1 -> 'No badges. Get out there and start earning some!'
  p ->
    text 'By the way, '
    a href: "http://p2pu.org", -> 'P2PU'
    ' would be a great place to start'
else
  h1 -> "You have #{@badges.howMany}!"
  if @badges.pending.length
    h2 -> "#{@badges.pending.length} pending approval"
    div '#pending-badges.js-badges', ->
      for badge in @badges.pending
        a href: @reverse('backpack.details', { badgeId: badge.id }), ->
          img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

  if @badges.accepted.length
    h2 -> "#{@badges.accepted.length} accepted"
    div '#accepted-badges.js-badges', ->
      for badge in @badges.accepted
        a href: @reverse('backpack.details', { badgeId: badge.id }), ->
          img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

  if @badges.rejected.length
    h2 -> "#{@badges.rejected.length} rejected"
    div '#rejected-badges.js-badges', ->
      for badge in @badges.rejected
        a href: @reverse('backpack.details', { badgeId: badge.id }), ->
          img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

div '.upload', ->
  h2 -> 'Upload Badges'
  p -> "If you have badges you've been awarded, you can upload them manually"

  form action: @reverse('backpack.upload'), method: 'post', enctype: 'multipart/form-data', ->
    fieldset ->
      div '.input', ->
        input type: 'hidden', name: 'csrf', value: @csrf
        input '#userBadge', type: 'file', name: 'userBadge', accept: 'image/png'
        input '.btn.primary', type: 'submit', value: 'Upload'
