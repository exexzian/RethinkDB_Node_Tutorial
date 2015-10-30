# RethinkDB, Node, Socket.io, Express Tutorial
## By Chris Cates

## Before you begin, there's a few things you need to do

### If you're starting a new project
- Install rethinkdb via homebrew `brew install rethinkdb`
- run `rethinkdb` or run it as a service.
- run `npm init` and define your project
- install a few packages `npm install rethinkdb socket.io express async --save-dev`
- then run `node /path/to/your/node/file.js`

### If you're trying to run this project
- Install rethinkdb via homebrew `brew install rethinkdb`
- run `rethinkdb`
- run `npm install`
- run `node app.js`

*Special Note - If you are on Windows, you will need to run RethinkDB in a Nitrous.io container.*

### If you're trying to run this project on Nitrous.io
- First setup RethinkDB: https://community.nitrous.io/tutorials/setting-up-rethinkdb-on-nitrous
- Then run `git clone https://github.com/Chris-Cates/RethinkDB_Node_Tutorial.git` in the Nitrous command line (it's at the bottom after opening the ide for the container)
- Then run `cd RethinkDB_Node_Tutorial`
- Then finally run `node app.js`


## Continuing on, let's explain each package

### The Rethinkdb package
- This is used as a driver to communicate with the RethinkDB server
- It provides the ReQL interface in Node.js syntax

### The Socket.io package
- This is coupled with a front end library for emitting and recieving socket events.
- Used for real time communication with the RethinkDB server

### The Express library
- While http server would've sufficed, I would still like to show a handy pattern to chain Express to Socket.io seamlessly
- I also would like to show you can seamlessly chain RethinkDB to express, and, safely close the connection on each RESTful request
- A fully statless RESTful API routing system

## Understanding the code
### 1) Creating the socket.io server
Typically, the first few lines of code are settings up the main project's dependencies, since we are only using three packages,
this will be relatively simple:
First we require express - `var express = require('express')` the problem with just express is that it's only RESTful and not realtime.
Don't worry, this is why we're going to chain `socket.io` to express so socket.io will listen on the same port as express. This makes life simpler for managing ports.
In order to do this we need to write the following:<br>
`var app = express();`<br>
`var server = require('http').createServer(app);`<br>
`var io = require('socket.io')(server);`

Also we need the rethinkdb driver included:
`r = require('rethinkdb')`

As you can see, if we use the vanilla http server package, chain express to it, then chain socket.io to it, we can have socket.io and express listening to the same ports.

### 2) Chaining RethinkDB to Express
A handy trick you might like, is that I chain RethinkDB to the Express request parameter. It's quite simple really. You have to make use of the `express.use()` parameter.
A simple way of doing this is writing the following: <br>
<pre><code>
  app.use(function(req,res,next) {
    r.connect({
      host: 'localhost', port: 28015
    }).then(function(conn) {
      req.r = r;
      req.conn = conn;
      next();
    });
  })
</code></pre>
Make sure you always CLOSE the connection after doing all your Express magic. Simply add this after your Express requests:<br>
<pre><code>
app.use(function(req,res,next) {
  if (req.conn) {
    req.conn.close();
    next();
  }
})
</code></pre>

### 3) Setting up your HTML file
Setting up the HTML file is super simple all we need to do is include socket.io and jquery.<br>
Then we initialize socket.io on the client side
<pre><code>
socket = io.connect();
</code></pre>
Now we can start emitting events to the server (as well as start recieving them).<br>
By default there is a connection event on the server and a connected event on the client.<br>
#### On the server:
<pre><code>
io.sockets.on('connection', function(socket) {
  console.log('Connected new client');
})
</code></pre>
#### On the client:
<pre><code>
socket.on('connect', function(data) {
  console.log('Connected');
});
</code></pre>

### 4) Generating database and tables on the fly on RethinkDB
Generally, you want to automatically generate the database and tables for your app automatically, this way, new developers don't have to worry about managing stuff through the web client.
We'll add something to the beginning of the app.js file which will automatically generate the database and tables on the fly.<br>
Please note we are using the async.js library. This helps make aysnchronous programming elegant, and, prevent nesting functions (callback hell perse). You can read up and learn about it here: https://github.com/caolan/async

<pre><code>
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
</code></pre>

This may seem like a lot for just generating a database and table, but, we are running the script asynchronously in series, creating the database first, and then the table.<br>
Some notes to keep in mind, is that you can run `.contains()` on `.tableList()` or `.dbList()` and it'll return true or false on callback based on what you make of it. <br>
Alternatively, you don't have to write `.dbCreate('rethinkdb_tutorial')` you can easily write `.db('rethinkdb_tutorial').dbCreate()` as well.<br>
This applies to `.tableCreate('messages')` except `.table('messages').tableCreate()` you can choose what you prefer best in the future. <br>
Also you need to create an index for `date` this is so that we can order messages ascending by `date`.

### 5) Uploading messages to the server / recieving all previous messages from the server
This is actually one of the easier steps. And all you need to do is create a `POST` and `GET` request. If you're familiar with Express, this will be a breeze, especially since we chained
RethinkDB to Express already.<br>

First things first, you want to an AJAX form in your HTML.<br>
For now we'll use jQuery for handling AJAX calls, since it's simple and easy.

<pre><code>
$('.message-submit').click(function() {
  var message = $('.message-input').val();
  $.post('/message', {message: message}, function(data) {
    console.log(data);
  });
});
</code></pre>
