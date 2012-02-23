var fs = require('fs');

var myFiles = [
  "issuer-parts/issuer-script-intro.js"
, "jquery.min.js"
, "jschannel.js"
, "issuer-parts/issuer-core.js"
, "issuer-parts/issuer-script-outro.js"
];

myFiles = myFiles.map(function(filename) {
  return __dirname + '/../static/js/' + filename;
});

exports.generateScript = function(req, res) {
  concatenate(myFiles, function(err, data) {
    if (err) {
      res.send(500);
      throw err;
    } else {
      res.header('Content-Type', 'application/javascript');
      res.send(data);
    }
  });
};

function concatenate(files, cb) {
  var completed = 0;
  var contents = [];
  
  function startLoading(i) {
    fs.readFile(files[i], function(err, data) {
      if (err) {
        cb(err);
        return;
      }
      contents[i] = data;
      completed++;
      if (completed == files.length)
        cb(null, contents.join('\n'));
    });
  }

  for (var i = 0; i < files.length; i++)
    startLoading(i);
};

if (module.parent === null) {
  concatenate(myFiles, function(err, data) {
    var filename = 'issuer.js';
    if (err)
      throw err;
    fs.writeFileSync(filename, data);
    console.log('wrote', filename, '(' + data.length, 'bytes)');
  });
}
