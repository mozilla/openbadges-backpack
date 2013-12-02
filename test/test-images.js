const path = require('path')
const fs = require('fs');
module.exports = {
  png: {
    unbaked: readfile('unbaked.png'),
    baked: readfile('valid-baked.png'),
  },
  svg: {
    unbaked: readfile('unbaked.svg'),
  }
}

function readfile(file) {
  return fs.readFileSync(path.join(__dirname, 'data', file))
}
