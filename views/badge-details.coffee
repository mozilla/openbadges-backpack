div '.badge-details', ->
  img src: @image
  dl ->
    dt -> 'Recipient'
    dd -> @recipient

    dt -> 'Name'
    dd -> @badge.name

    dt -> 'Description'
    dd -> @badge.description

    dt -> 'Criteria'
    dd -> @badge.criteria

    dt -> 'Issuer'
    dd -> "#{@badge.issuer.name} (#{@badge.issuer.origin})"

    if @badge.issuer.org
      dt -> 'Organization'
      dd -> @badge.issuer.org

if @owner
  div '.management', ->
    div '.accept-reject', ->
      h2 -> 'Keep this badge?'
      form action: @reverse('backpack.apiAccept', { badgeId: @id }), method: 'post', style: 'display: inline', ->
        input type: 'hidden', name: 'csrf', value: @csrf
        input '.btn.primary', type: 'submit', value: 'Accept Badge'
      form action: @reverse('backpack.apiReject', { badgeId: @id }), method: 'post', style: 'display: inline', ->
        input type: 'hidden', name: 'csrf', value: @csrf
        input '.btn', type: 'submit', value: 'Reject Badge'

    div '.groups', ->
      h2 -> 'Add to Groups'
      form action: @reverse('backpack.apiGroupAdd', { badgeId: @id }), method: 'post', ->
        input type: 'hidden', name: 'csrf', value: @csrf
        textbox id: 'group', placeholder: 'Group name'
        if @groups.length
          text "- or -"
          select multiple: true, ->
            for group in @groups
              option value: group, -> group

        input '.btn.primary', type: 'submit', value: 'Add to Group'

