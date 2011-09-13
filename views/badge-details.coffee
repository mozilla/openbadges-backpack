div '.row', ->
  div '.span5.columns.badge-details', ->
    img src: @image
    dl ->
      dt -> 'Recipient'
      dd -> @recipient

      dt -> 'Name'
      dd -> @type.name

      dt -> 'Description'
      dd -> @type.description

      dt -> 'Criteria'
      dd -> @type.criteria

      dt -> 'Issuer'
      dd -> "#{@type.issuer.name} (#{@type.issuer.origin})"

      if @type.issuer.org
        dt -> 'Organization'
        dd -> @type.issuer.org

  if @owner
    div '.span11.columns.management', ->
      div '.accept-reject', ->
        h2 -> 'Keep this badge?'
        form action: @reverse('backpack.apiAccept', { badgeId: @id }), method: 'post', style: 'display: inline', ->
          input type: 'hidden', name: 'csrf', value: @csrf
          input '.btn.primary', type: 'submit', value: 'Accept Badge'
        form action: @reverse('backpack.apiReject', { badgeId: @id }), method: 'post', style: 'display: inline', ->
          input type: 'hidden', name: 'csrf', value: @csrf
          input '.btn', type: 'submit', value: 'Reject Badge'

      div '.groups', ->
        h2 -> 'Manage Groups'
        form action: @reverse('backpack.apiGroupAdd', { badgeId: @id }), method: 'post', ->
          input type: 'hidden', name: 'csrf', value: @csrf
          if @groups.length
            for group in @groups
              div '.clearfix', -> div '.input-append', ->
                input '.mini', maxlength: 32,  type: 'text', value: group, disabled: true
                label '.add-on', -> input type: 'checkbox', name: "group.#{group}", checked: true

          div '.clearfix', -> div '.input-append', ->
            input '.mini', maxlength: 32,  type: 'text', name: "newGroup", placeholder: 'New group'
            label '.add-on', -> input type: 'checkbox'

          input '.btn.primary', type: 'submit', value: 'Manage Groups'

coffeescript ->
  checkboxes = $('.input-append input[type=checkbox]')
  change = (event) ->
    self = $(@)
    label = self.parent()
    input = label.siblings('input').first()
    if self.attr('checked')
      label.addClass('active')
      if not input.val() then input.trigger('focus')
    else
      label.removeClass('active')

  checkboxes.bind('change', change).trigger('change')
