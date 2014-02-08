var connect = require('connect'),
    fs = require('fs');

connect().use(connect.static(__dirname + '/dist'))
.use(function(req, res){
  res.end(fs.readFileSync('./dist/index.html'));
}).listen(8081);


console.log('start on 8081');