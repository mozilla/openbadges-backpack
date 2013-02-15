var path = require('path');
var fs = require('fs');

function findSHAInHead(file) {
  try {
    var head = fs.readFileSync(file, 'utf8').trim();
  }
  catch (ex) {
    throw new Error('Could not read HEAD file: ' + file);
  }
  if(head.indexOf('ref:') === 0){
    var ref = head.split(/\s+/)[1].trim();
    var gitDir = path.dirname(file);
    var refFile = path.join(gitDir, ref);
    return findSHAInRef(refFile);
  }
  else if(/^[0-9a-f]{40}$/m.test(head)) {
    return head;
  }
  else {
    throw new Error('Unable to parse HEAD file: ' + file);
  }
};

function findSHAInRef(file) {
  try {
    var sha = fs.readFileSync(file, 'utf8').trim();
  }
  catch (ex) {
    throw new Error('Could not read ref file: ' + file);
  }
  return sha;
}
 
exports.findSHA = function(file) {
  var file = file || path.join(__dirname, '../.git/HEAD');
  return findSHAInHead(file);
};
