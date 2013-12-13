const Badge = require('./badge')
const Base = require('./mysql-base');
const bakery = require('openbadges-bakery')
const async = require('async')

const BadgeImage = function (attr) { this.attributes = attr }
Base.apply(BadgeImage, 'badge_image');

BadgeImage.prototype.toBuffer = function toBuffer() {
  return Buffer(this.get('image_data'), 'base64');
};

BadgeImage.prototype.isBaked = function () {
  return this.get('baked')
}

BadgeImage.prototype.bakeAndSave = function (globalCallback) {
  const imageData = this.toBuffer()

  const findBadge = function findBadge(callback) {
    const query = {body_hash: this.get('badge_hash')}
    Badge.findOne(query, callback)
  }.bind(this)

  const bakeBadge = function bakeBadge(badge, callback) {
    if (!badge)
      return callback(new Error('could not find badge'))

    const endpoint = badge.get('endpoint')
    const signature = badge.get('signature')

    if (signature) {
      return bakery.bake({
        signature: signature,
        image: imageData
      }, callback)
    }

    const assertion = badge.get('body')
    assertion.verify = { type: 'hosted', url: endpoint }
    return bakery.bake({
      image: imageData,
      assertion: assertion,
    }, callback)

  }.bind(this)

  const saveImage = function saveImage(bakedImageData, callback) {
    const b64image = Buffer(bakedImageData).toString('base64')
    this.set('image_data', b64image)
    this.set('baked', true)
    this.save(callback)
  }.bind(this)

  async.waterfall([
    findBadge,
    bakeBadge,
    saveImage,
  ], globalCallback)
}

module.exports = BadgeImage;
