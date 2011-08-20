var request = require('request');

request('http://browserid.org', function(error, response, body) {
  if (!error && response.statusCode == 200) {
    console.log(body);
  }
})

  