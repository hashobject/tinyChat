var connect = require('connect');

connect().use(connect.static(__dirname + '/dist')).listen(8081);

console.log('start on 8081');