var request = require('request')


exports.chris = function(req, res) {
  res.render('chris', {
    cooldude: 'chris'
  });
};
  