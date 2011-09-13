h1 -> @type.name
div '.row', ->
  div '.span-one-third.columns.badge-details', ->
    img '#badge-image', src: @image, alt: 'Badge Image"'
    dl ->
      dt -> 'Recipient'
      dd -> @recipient

      dt -> 'Name'
      dd -> safe @type.name

      dt -> 'Description'
      dd -> safe @type.description

      dt -> 'Criteria'
      dd -> @type.criteria

      dt -> 'Issuer'
      dd -> safe "#{@type.issuer.name} (#{@type.issuer.origin})"

      if @type.issuer.org
        dt -> 'Organization'
        dd -> safe @type.issuer.org

  if @owner
    div '.span-two-thirds.columns.management', ->
      div '.accept-reject', ->
        h2 -> 'Keep this badge?'
        form action: @reverse('backpack.apiAccept', { badgeId: @id }), method: 'post', style: 'display: inline', ->
          input type: 'hidden', name: 'csrf', value: @csrf
          input '.btn.primary', type: 'submit', value: 'Accept Badge'
        form action: @reverse('backpack.apiReject', { badgeId: @id }), method: 'post', style: 'display: inline', ->
          input type: 'hidden', name: 'csrf', value: @csrf
          input '.btn.danger', type: 'submit', value: 'Reject Badge'

      div '.groups', ->
        h2 -> 'Manage Groups'
        form action: @reverse('backpack.apiGroups', { badgeId: @id }), method: 'post', ->
          input type: 'hidden', name: 'csrf', value: @csrf

          if @groups.length
            for group in @groups
              div '.clearfix', -> div '.input-append', ->
                input '.mini', maxlength: 32,  type: 'text', value: group, disabled: true
                label '.add-on', -> input type: 'checkbox', name: "group[#{group}]", checked: @badge.inGroup(group)

          div '.clearfix', -> div '.input-append', ->
            input '#new-group.mini', maxlength: 32,  type: 'text', name: "newGroup", placeholder: 'New group'
            label '.add-on', -> input type: 'checkbox'

          input '.btn.primary', type: 'submit', value: 'Manage Groups'

coffeescript ->
  newGroup = $('#new-group')
  checkboxes = $('.input-append input[type=checkbox]')
  image = $('#badge-image')

  image.bind 'load', (event) ->
    if @clientWidth > 256 then $(@).css(width: '256px')

  watchChanges = (event) ->
    elem = $(@)
    label = elem.parent()
    input = label.siblings('input').first()
    if elem.attr('checked')
      label.addClass('active')
      if not input.val() then input.trigger('focus')
    else
      label.removeClass('active')

  autocheck = (event) ->
    elem = $(@)
    checkbox = elem.siblings('label').first().find('input')
    checked = if elem.val() then true else false
    checkbox
      .attr('checked', checked)
      .trigger('change')

  shortDisable = () ->
    elem = $(@)
    checkbox = elem.siblings('label').first().find('input')
    checkbox.attr('disabled', true)
    setTimeout ->
      checkbox.attr('disabled', false)
    , 20


  checkboxes.bind('change', watchChanges).trigger('change')
  newGroup.bind('keydown', autocheck).bind('blur', autocheck).bind('blur', shortDisable)
