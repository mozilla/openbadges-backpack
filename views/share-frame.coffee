for badge in @badges
  a href: @reverse('share.badge', { badgeId: badge.id }), ->
    img id: "id.#{badge.id}", src: badge.meta.imagePath, width: '64px'

coffeescript ->
  links = document.getElementsByTagName('a')
  handle = (event) ->
    window.open(@href, @href.split('/b/')[1], "width=400,height=600" )
    event.stopPropagation()
    return false
  for link in links
    link.onclick = handle
