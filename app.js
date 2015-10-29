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
