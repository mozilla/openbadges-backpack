const fs = require('fs');
module.exports = {
  'private': fs.readFileSync(__dirname + '/rsa-private.pem'),
  'public': fs.readFileSync(__dirname + '/rsa-public.pem'),
  'wrongPublic': fs.readFileSync(__dirname + '/rsa-wrong-public.pem'),
};