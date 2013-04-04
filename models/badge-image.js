const Base = require('./mysql-base');

const BadgeImage = function (attr) { this.attributes = attr }
Base.apply(BadgeImage, 'badge_image');

BadgeImage.prototype.toBuffer = function toBuffer() {
  return Buffer(this.get('image_data'), 'base64');
};

module.exports = BadgeImage;

