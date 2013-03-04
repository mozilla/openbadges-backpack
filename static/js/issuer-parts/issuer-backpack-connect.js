OpenBadges.connect = (function() {
  var ACCESS_ENDPOINT = 'access';
  
  function absoluteClientUrl(path) {
    var a = document.createElement('a');
    a.setAttribute('href', path);
    return a.href;
  }
  
  return function connect(options) {
    if (!options)
      throw new Error("options object expected");
    if (!$.isArray(options.scope))
      throw new Error("scope must be an array");
    if (typeof(options.callback) != "string")
      throw new Error("callback must be a URL");
    
    var location = options.location || window.location;
    var redirect = OpenBadges.getRoot() + ACCESS_ENDPOINT + '?' + $.param({
      callback: absoluteClientUrl(options.callback),
      scope: options.scope.join(',')
    });

    location.replace(redirect);
  };
})();
