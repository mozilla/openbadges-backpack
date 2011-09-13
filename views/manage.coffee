if not @badges?
  h1 -> 'No badges. Get out there and start earning some!'
  p ->
    text 'By the way, '
    a href: "http://p2pu.org", -> 'P2PU'
    ' would be a great place to start'

else
  div '.row', ->
    div '.span-one-third.column', ->
      h1 -> "Badges"
      if @badges.pending.length
        h3 -> "Pending"
        div '#pending-badges.js-badges', ->
          for badge in @badges.pending
            a href: @reverse('backpack.details', { badgeId: badge.id }), ->
              img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

      if @badges.accepted.length
        h3 -> "Accepted"
        div '#accepted-badges.js-badges', ->
          for badge in @badges.accepted
            a href: @reverse('backpack.details', { badgeId: badge.id }), ->
              img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

      if @badges.rejected.length
        h3 -> "Rejected"
        div '#rejected-badges.js-badges', ->
          for badge in @badges.rejected
            a href: @reverse('backpack.details', { badgeId: badge.id }), ->
              img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

      div '.upload', ->
        h4 -> 'Upload Badges'
        p -> "If you have badges you've been awarded, you can upload them manually"

        form action: @reverse('backpack.upload'), method: 'post', enctype: 'multipart/form-data', ->
          fieldset ->
            div '.clearfix', ->
              input type: 'hidden', name: 'csrf', value: @csrf
              input '#userBadge', type: 'file', name: 'userBadge', accept: 'image/png'

            div '.clearfix', -> input '.btn.primary', type: 'submit', value: 'Upload'

    div '.span-two-thirds.column.groups', ->
      h1 -> "Groups"

      if not Object.keys(@badges.groups).length
        h2 -> "You haven't made any groups yet."
      for name, group of @badges.groups
        h3 -> name

        div '.well', style: 'position: relative', ->
          button '.btn.small.primary', style: 'position: absolute; top: 4px; right: 4px; padding: 4px;', -> 'embed'
          for badge in group
            img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'
