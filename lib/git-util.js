var path = require('path');

exports.findSHA = function(callback, altfs) {
  var fs = altfs || require('fs');
  fs.readFile(path.join(__dirname, '..', '.git/HEAD'), 'utf8', function(err, head){
    if (err) { 
      callback(err); 
    }
    else {
      if(head.indexOf('ref:') === 0){
        var ref = head.split(/\s+/)[1];
        fs.readFile(path.join(__dirname, '..', '.git', ref.trim()), 'utf8', function(err, sha){
          if (!err) callback(null, sha.trim());
          else callback(err);
        });
      }
      else if(/^[0-9a-f]{40}$/m.test(head)) {
        callback(null, head.trim());
      }
      else {
        callback(new Error('Unable to parse .git/HEAD'));
      }
    }
  });
};
 
