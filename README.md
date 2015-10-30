# A Simple chat app in RethinkDB
### By Chris Cates

### What you will be learning:
In this tutorial you will be learning how to create a basic chat application utilizing RethinkDB's `.changes()` function. You will also be learning
how to create a database and table for RethinkDB elegantly with `async.js` and how to create basic `GET` and `POST` requests in Express coupled with RethinkDB.

## Setting up the project:
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

### If you're trying to run this project on Nitrous.io
- Setup a node.js container
- First setup RethinkDB: https://community.nitrous.io/tutorials/setting-up-rethinkdb-on-nitrous
- Then run `git clone https://github.com/Chris-Cates/RethinkDB_Node_Tutorial.git` in the Nitrous command line (it's at the bottom after opening the ide for the container)
- Then run `cd RethinkDB_Node_Tutorial`
- Then run `npm install`
- Then finally run `node app.js`

## Understanding the code
### 1) Creating the Socket.io and Express server
#### What we need to do:
First we require express - `var express = require('express')` the problem with just express is that it's only RESTful and not realtime.
Don't worry, this is why we're going to chain `socket.io` to express so socket.io will listen on the same port as express. This makes life simpler for managing ports.
In order to do this we need to write the following:<br>
`var app = express();`<br>
`var server = require('http').createServer(app);`<br>
`var io = require('socket.io')(server);`
#### What is the socket.io package?
- A real time communication library for server's and client's.
- Will be used with the RethinkDB server to emit and recieve socket events.
#### What is the Express package?
- Express is a fully RESTful routing system
- Will be used with the RethinkDB server to `GET` and `POST` data.

Also we need the rethinkdb driver included:
`r = require('rethinkdb')`
#### What is `r` exactly?
- `r` is the RethinkDB driver that is included by `r = require('rethinkdb')`
- It communicates with the RethinkDB database with the ReQL API.

### 2) Chaining RethinkDB to Express
A handy trick you might like, is chaining RethinkDB to the Express request parameter. It's quite simple really. You have to make use of the `express.use()` parameter.
#### Opening the connection
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
#### Closing the connection
<pre><code>
app.use(function(req,res,next) {
  if (req.conn) {
    req.conn.close();
    next();
  }
})
</code></pre>
Make sure you always CLOSE the connection after doing all your Express magic. Simply add this after your Express requests:<br>
*Note: you MUST close the RethinkDB connection before serving HTML files!!!*

### 3) Setting up your HTML file
In the HTML file we will include socket.io and jquery. In this demo, we included it via a CDN.<br>
Then we initialize socket.io on the client side.
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
We will touch on this subject more later. But for now, we need to create database and tables in RethinkDB.

### 4) Generating database and tables on the fly on RethinkDB
Generally, you want to automatically generate the database and tables for your app automatically, this way, new developers don't have to worry about managing stuff through the web client.
We'll add something to the beginning of the app.js file which will automatically generate the database and tables on the fly.<br>
Please note we are using the async.js library. This helps make aysnchronous programming elegant, and, prevent heavily nested functions (callback hell perse). You can read up and learn about it here: https://github.com/caolan/async

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
Some notes to keep in mind, is that you can run `.contains()` on `.tableList()` or `.dbList()` and it'll return true or false on callback based on whether the database or table was created. <br>
Alternatively, you don't have to write `.dbCreate('rethinkdb_tutorial')` you can easily write `.db('rethinkdb_tutorial').dbCreate()` as well.<br>
This applies to `.tableCreate('messages')` except `.table('messages').tableCreate()` you can choose what you prefer best in the future. <br>
Also you need to create an index for `date` this is so that we can order messages ascending by `date`.

### 5) Uploading messages to the server / recieving all previous messages from the server
This is actually one of the easier steps. And all you need to do is create a `POST` and `GET` request. If you're familiar with Express, this will be a breeze, especially since we chained
RethinkDB to Express already.<br>

First, you want to an AJAX form in your HTML.<br>
For now we'll use jQuery for handling AJAX calls, since it's simple and easy.

<pre><code>
$('.message-submit').click(function() {
  var message = $('.message-input').val();
  $.post('/message', {message: message}, function(data) {
    console.log(data);
  });
});
</code></pre>

We'll also add a `POST` request in Express to send data and insert into RethinkDB. It's super simple:

<pre><code>
app.post('/message', function(req,res,next) {
  req.r.db('rethinkdb_tutorial').table('messages').insert({
    message: req.body.message,
    date: new Date()
  }).run(req.conn, function(err,rRes) {
    if (err) throw err;
    res.send("Message sent!");
  })
});
</code></pre>

It's pretty self explanatory, all we need to do is `.insert()` the message (which was sent via JSON) and add the current date as a timestamp for the message.<br>
Note that after the insert completes, we do `res.send("Message sent!");` to send to the client that the message was sent.<br>
Moving on let's do a `GET` request in Express to get all the pre-existing messages in RethinkDB.
<pre><code>
app.get('/message', function(req,res,next) {
  req.r.db('rethinkdb_tutorial').table('messages').orderBy({index: req.r.desc('date')})
  .run(req.conn, function(err,cursor) {
    cursor.toArray(function(err,cursorRes) {
      if (err) throw err;
      res.send(cursorRes);
    });
  });
})
</code></pre>
This time around we are ordering all the messages by the date. Note that we made an index previously in our DB generating script to make sure the script can order by the secondary index date.
RethinkDB returns a cursor upon recieving data. All we need to do is run `toArray()` on it, and, we can extract the data in easy to read JSON. <br>
We finally send the data via `res.send(cursorRes)`.

### 6) Making it realtime with .changes() and socket.io
#### On the server
First thing we want to do is listen for all the changes in socket.io

<pre><code>
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
</code></pre>

First we connect to rethinkDB with `r.connect(rConfig)` and then we use the `changes()` function to run a continous stream to the data.<br>
Everytime a new message is emitted we emit it in socket.io via `io.emit('new_message', cursorRes)`. Also note that the `change()` feed uses `.each()` to convert data into JSON,
not `toArray()`. <br>
Note that we iterate conn outside of the scope of `r.connect` so we can close in it in the `.finally()` function

#### On the client side
Now on the client side, we want to inject HTML into the messages container:
<pre><code>
socket.on('new_message', function(res) {
  console.log(res);
  var obj = $('#' + res.new_val.id);
  if (obj.length == 0) {
    $('.messages').prepend("<div id='"+ res.new_val.id +"'>" + res.new_val.message + " sent on " + res.new_val.date + "</div>");
  } else {
    //Do nothing
  }
})
</code></pre>
Typically I would prefer to use React to solve the problem, since it's more elegant, but, for demonstration purposes. We will use just plain jQuery and inject HTML like this.
It's quite simple really. Once you connect socket.io on the client side by doing `socket = io.connect()` you can start sending and recieving messages.
All you have to do is recieve messages by `socket.on('name_of_event', function(result) { ... })` As you can see in the sample code. We take the array from the `.change()` feed
and convert it into readable HTML.


### Conclusion
You should be well equipped for your future projects. And now you can make real time apps in a breeze in Node.js! I highly reccomend using React to mutate the DOM as opposed to
just plain jQuery. And I also reccomend Redux for storing and mapping data in an elegant way.<br><br>

If you have any questions. Feel free to email me at codeviolet@chriscates.ca<br>
Cheers, Chris
