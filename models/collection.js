var mysql = require('../lib/mysql'),
    Base = require('./mysql-base.js');

var Collection = function (data) { this.data = data; };
Base.apply(Collection, 'collection');

var CollectionBadge = function (data) { this.data = data; };
Base.apply(CollectionBadge, 'collection_badge');

module.exports = Collection;