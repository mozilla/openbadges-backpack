const fs = require('fs');
module.exports = {
  unbaked: fs.readFileSync(__dirname + '/data/unbaked.png'),
}