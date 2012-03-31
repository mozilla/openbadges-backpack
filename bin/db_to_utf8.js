var client = require('../lib/mysql').client;
var conf = require('../lib/configuration').get('database');

var ENCODING = 'utf8';

var statements = [];
statements.push("ALTER DATABASE `" + conf.database + "` CHARACTER SET " + ENCODING + ";"); 
var tables = ['user', 'badge', 'group', 'portfolio'];
tables.forEach(function (table) {
  statements.push("ALTER TABLE `" + table + "` CONVERT TO CHARACTER SET " + ENCODING + ";");
});
   
runEach(statements, function(){ process.exit(0); });

function runEach(statements, done) {
  var i = 0;

  function run(index) {
    return function(err){
      if(err) {
        throw err;
      }
      if(index < statements.length) {
        var statement = statements[index];
        console.log(statement);
        client.query(statement, run(index+1));
      }
      else {
        done();
      }
    };
  }
  
  run(0)();
}

  
