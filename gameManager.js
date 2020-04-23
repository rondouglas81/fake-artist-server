const { randomId } = require('./utils');
const _ = require('lodash');

var _io, _socket;

const gamesList = [];

exports.init = function (io, socket) {
  _io = io;
  _socket = socket;

  _socket.emit('connected', { message: 'You are connected!' });

  _socket.on('hostGame', onHostGame);
  _socket.on('hostGameStart', onHostGameStart);
  _socket.on('hostGameEnd', onHostGameEnd);

  _socket.on('joinGame', onJoinGame);

  _socket.on('message', onMessage);
};

exports.createGame = function () {
  const gameId = randomId();
  gamesList.push({ gameId, players: [], state: 'notStarted' });
  console.log(gamesList);
  return gameId;
};

function onHostGame(params) {
  const game = _.find(gamesList, ['gameId', params.gameId]);
  if (game) {
    console.log('host joined game', params.gameId);
    this.join(params.gameId);
    this.emit('hostJoinedGame', game);
  } else {
    console.log('game', params.gameId, 'not found');
    this.emit('notFound', params.gameId);
  }
}

function onHostGameStart(params) {}

function onHostGameEnd(params) {}

function onJoinGame(params) {
  const game = _.find(gamesList, ['gameId', params.gameId]);

  if (game) {
    if (_.includes(game.players, params.username)) {
      console.log('player reconnected', params.gameId, params.username);
      this.join(params.gameId);
      _io.to(game.gameId).emit('playerReconnected', {
        username: params.username,
        gameData: game,
      });
    } else {
      console.log('player joined game', params.gameId, params.username);
      game.players.push(params.username);
      this.join(params.gameId);
      _io.to(game.gameId).emit('playerJoinedGame', {
        username: params.username,
        gameData: game,
      });
    }
  } else {
    console.log('game', params.gameId, 'not found');
    this.emit('notFound', params.gameId);
  }
}

function onMessage(params) {
  console.log('incoming message', params);
  _io.to(params.gameId).emit('response', params.message);
}
