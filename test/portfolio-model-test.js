var vows = require('vows')
  , Portfolio = require('../models/portfolio')
  , should = require('should')

var UNICODE_TITLE = "てすと";

vows.describe('Portfolio model').addBatch({
  'A portfolio': {
    'with unicode characters in its title': {
      topic: function () {
        return new Portfolio({
          group_id: 1,
          title: UNICODE_TITLE,
          stories:{}
        });
      },
      'when saved': {
        topic: function(portfolio) {
          portfolio.save(this.callback);
        },
        'and restored': {
          topic: function(portfolio) {
            Portfolio.findOne({group_id: portfolio.get('group_id')}, this.callback);
          },
          'should not garble the title': function(portfolio) {
            portfolio.get('title').should.equal(UNICODE_TITLE);
          }
        }
      }
    }
  }
}).export(module);

