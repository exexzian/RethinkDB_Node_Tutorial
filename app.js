var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var r = require('rethinkdb');
var path = require('path');
var async = require('async');

//RethinkDB configuration
var rConfig = {
  host: 'localhost', port: 28015
}

//Automatically generate RethinkDB databases and tables
r.connect(rConfig).then(function(conn) {
  async.series([
    function(finished) {
      r.dbList().contains('rethinkdb_tutorial').run(conn, function(err,res) {
        if(res == false) {
          r.dbCreate('rethinkdb_tutorial').run(conn, function(err,res) {
            finished();
          });
        } else {
          finished();
        }
      });
    },
    function(finished) {
      r.db('rethinkdb_tutorial').tableList().contains('messages').run(conn, function(err,res) {
        if(res == false) {
          r.db('rethinkdb_tutorial').tableCreate('messages').run(conn, function(err,res) {
            finished();
          });
        } else {
          finished();
        }
      })
    }
  ], function() {
    conn.close();
  });
});


//First chain RethinkDB to Express
app.use(function(req,res,next) {
  r.connect(rConfig).then(function(conn) {
    req.r = r;
    req.conn = conn;
    next();
  });
});

//Then close the RethinkDB Express chain
app.use(function(req,res,next) {
  if (req.conn) {
    req.conn.close();
    next();
  }
});

//Render index.html on unused routes
app.get('*', function(request, result) {
  result.sendFile(path.join(__dirname + '/index.html'));
});


//Listen on Port 3000 finally
app.listen(3000);
console.log("App running on port 3000")
