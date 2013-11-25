const path = require('path')
const fs = require('fs');
module.exports = {
  unbaked: fs.readFileSync(path.join(__dirname, '/data/unbaked.png')),
}
