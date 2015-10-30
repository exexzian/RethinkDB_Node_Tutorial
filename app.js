var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var r = require('rethinkdb');
var path = require('path');
var async = require('async');
var bodyParser = require('body-parser');

//RethinkDB configuration
var rConfig = {
  host: 'localhost', port: 28015
}

//Automatically generate RethinkDB databases and tables
r.connect(rConfig).then(function(conn) {
  async.series([
    function(finished) {
      r.dbList().contains('rethinkdb_tutorial').run(conn, function(err,res) {
        if (err) throw err;
        if(res == false) {
          r.dbCreate('rethinkdb_tutorial').run(conn, function(err,res) {
            if (err) throw err;
            finished();
          });
        } else {
          finished();
        }
      });
    },
    function(finished) {
      r.db('rethinkdb_tutorial').tableList().contains('messages').run(conn, function(err,res) {
        if (err) throw err;
        if(res == false) {
          r.db('rethinkdb_tutorial').tableCreate('messages').run(conn, function(err,res) {
            if (err) throw err;
            r.db('rethinkdb_tutorial').table('messages').indexCreate('date').run(conn, function(err,res) {
              if (err) throw err;
              finished();
            });
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

//Connect new Socket.io client
io.sockets.on('connection', function(socket) {
  console.log('Connected new client');
});
//We use the ultra handy "changes" method in RethinkDB to emit new messages.
var conn;
r.connect(rConfig).then(function(c) {
  conn = c;
}).finally(function() {
  r.db('rethinkdb_tutorial').table('messages').changes().run(conn, function(err, cursor) {
    if (err) throw err;
    cursor.each(function(err,cursorRes) {
      io.emit('new_message', cursorRes);
    });
  })
})

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

//First chain RethinkDB to Express
app.use(function(req,res,next) {
  r.connect(rConfig).then(function(conn) {
    req.r = r;
    req.conn = conn;
    next();
  });
});

//The POST request to insert a message into the database
app.post('/message', function(req,res,next) {
  req.r.db('rethinkdb_tutorial').table('messages').insert({
    message: req.body.message,
    date: new Date()
  }).run(req.conn, function(err,rRes) {
    if (err) throw err;
    res.send("Message sent!");
  })
});

//The GET request to get all the previous existing messages from the database.
app.get('/message', function(req,res,next) {
  req.r.db('rethinkdb_tutorial').table('messages').orderBy({index: req.r.desc('date')})
  .run(req.conn, function(err,cursor) {
    cursor.toArray(function(err,cursorRes) {
      if (err) throw err;
      res.send(cursorRes);
    });
  });
})

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
server.listen(3000);
console.log("App running on port 3000")
