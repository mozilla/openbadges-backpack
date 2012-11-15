var _ = require('underscore');

exports.genstring = function genstring(length) {
  var alphanum = 'abcdefghijklmnopqrstuvwxyz ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_';
  var str = [];
  var ind = 0;
  for (var i = 0; i < length; i += 1) {
    ind = Math.floor(Math.random() * (alphanum.length - 1));
    str.push(alphanum[ind]);
  }
  return str.join('');
};