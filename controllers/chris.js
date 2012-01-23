var request = require('request')


exports.chris = function(req, res) {
  res.render('chris', {
    'cooldude': 'chris mcavoy',
    'cooldudes': [{'name':'camri'}, 
                  {'name':'wil'},
                  {'name':'tulip'}, 
                  {'name':'chris'}]
  });
};
  