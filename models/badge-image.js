const Base = require('./mysql-base');

const BadgeImage = function (attr) { this.attributes = attr }
Base.apply(BadgeImage, 'badge_image');

module.exports = BadgeImage;

