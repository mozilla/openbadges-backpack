if @owner
  h2 -> 'This is your badge'
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
  dd ->
    text @badge.issuer.name
    "(#{@badge.issuer.origin})"

  if @badge.issuer.org
    dt -> 'Organization'
    dd -> @badge.issuer.org

if @owner
  form action: @reverse('backpack.apiAccept', { badgeId: @id }), method: 'post', style: 'float: left', ->
    input type: 'hidden', name: 'csrf', value: @csrf
    input '.btn.primary', type: 'submit', value: 'Accept'
  form action: @reverse('backpack.apiReject', { badgeId: @id }), method: 'post', style: 'float: left', ->
    input type: 'hidden', name: 'csrf', value: @csrf
    input '.btn', type: 'submit', value: 'Reject'
