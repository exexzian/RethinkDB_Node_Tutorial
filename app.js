var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var r = require('rethinkdb');

//First chain RethinkDB to Express
app.use(function(req,res,next) {
  r.connect({
    host: 'localhost', port: 28015
  }).then(function(conn) {
    req.r = r;
    req.conn = conn;
    next();
  });
});

//Render index.html on unused routes
app.get('*', function(request, result) {
  result.sendFile(path.join(__dirname + '/index.html'));
});

//Then close the RethinkDB Express chain
app.use(function(req,res,next) {
  if (req.conn) {
    req.conn.close();
    next();
  }
});

//Listen on Port 3000 finally
app.listen(3000);
