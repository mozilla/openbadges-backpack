module.exports = process.env.BACKPACK_COV
  ? require('./lib-cov/backpack')
  : require('./lib/backpack');
