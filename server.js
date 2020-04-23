const express = require('express');
const http = require('http');
const cors = require('cors');
const socketIo = require('socket.io');

const port = process.env.PORT || 4001;

const index = require('./routes/index');

const GameManager = require('./gameManager');

const app = express();
app.use(cors());
app.use(index);

const server = http.createServer(app);

const io = socketIo(server);

io.on('connection', socket => {
  console.log(
    'new client connection from ',
    socket.request.connection.remoteAddress,
    socket.id
  );

  GameManager.init(io, socket);

  socket.on('disconnect', () => console.log('client disconnected'));
});

server.listen(port, () => console.log(`listening on port ${port}`));
