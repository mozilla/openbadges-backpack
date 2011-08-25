var vows = require('vows')

vows.describe('Issuing by remote assertion').addBatch({
  'Submitting a': {
    'good assertion': {
      'should get `status == success`': {},
      'should get `id == <something>`': {}
    },
    'bad assertion': {
      'should get `status == failure`': {},
      'should get `error == validation`': {}
    },
    'really bad assertion (not even json)': {
      'should get `status == failure`': {},
      'should get `error == unaccepted`': {}
    },
    'dreadful assertion (4xx or 5xx or DNS error)': {
      'should get `status == failure`': {},
      'should get `error == unretrievable`': {}
    }
  }
}).export(module);
