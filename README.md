### RethinkDB, Node, Socket.io, Express Tutorial
## By Chris Cates

## Before you begin, there's a few things you need to do

# If you're starting a new project
- Install rethinkdb via homebrew `brew install rethinkdb`
- run `rethinkdb` or run it as a service.
- run `npm init` and define your project
- install a few packages `npm install rethinkdb socket.io express`
- then run `node /path/to/your/node/file.js`

# If you're trying to run this project
- Install rethinkdb via homebre `brew install rethinkdb`
- run `rethinkdb`
- run `npm install`
- run `node app.js`

*Special Note*
If you are on Windows, you will need to run RethinkDB in a Docker container. Unfortunately, this tutorial will not cover that.

## Continuing on, let's explain each package

# The Rethinkdb package
- This is used as a driver to communicate with the RethinkDB server
- It provides the ReQL interface in Node.js syntax

# The socket.io package
- This is coupled with a front end library for emitting and recieving socket events.
- Used for real time communication with the RethinkDB server

# The Express library
- While http server would've sufficed, I would still like to show a handy trick to chain Express to Socket.io seamlessly
- A fully statless RESTful API routing system
