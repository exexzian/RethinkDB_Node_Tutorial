# RethinkDB, Node, Socket.io, Express Tutorial
## By Chris Cates

## Before you begin, there's a few things you need to do

### If you're starting a new project
- Install rethinkdb via homebrew `brew install rethinkdb`
- run `rethinkdb` or run it as a service.
- run `npm init` and define your project
- install a few packages `npm install rethinkdb socket.io express`
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
`app.use(function(req,res,next) {
  r.connect({
    host: 'localhost', port: 28015
  }).then(function(conn) {
    req.r = r;
    req.conn = conn;
    next();
  });
})`
