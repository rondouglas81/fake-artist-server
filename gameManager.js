const { randomId } = require('./utils');
const _ = require('lodash');

var _io, _socket;

const gamesList = {};

const colors = ['red', 'blue', 'green', 'purple', 'orange'];

exports.init = function (io, socket) {
  _io = io;
  _socket = socket;

  _socket.emit('connected', { message: 'You are connected!' });

  _socket.on('hostGame', onHostGame);
  _socket.on('hostStartGame', onHostGameStart);
  _socket.on('hostEndGame', onHostGameEnd);

  _socket.on('joinGame', onJoinGame);
  _socket.on('playerDrawFinished', onPlayerDrawFinished);

  _socket.on('message', onMessage);
};

exports.createGame = function () {
  const gameId = randomId();
  gamesList[gameId] = {
    gameId,
    hostId: null,
    players: [],
    state: 'notStarted',
    round: 0,
    lineData: [],
    currentPlayerIndex: 0,
  };
  console.log(gamesList);
  return gameId;
};

function onHostGame(params) {
  const game = gamesList[params.gameId];
  if (game) {
    console.log('host joined game', params.gameId);
    game.hostId = this.id;
    this.join(params.gameId);
    this.emit('hostJoinedGame', game);
  } else {
    console.log('game', params.gameId, 'not found');
    this.emit('notFound', params.gameId);
  }
}

function onHostGameStart() {
  const game = _.find(gamesList, ['hostId', this.id]);
  if (game) {
    console.log('found the game for this host', game.gameId);
    game.state = 'started';
    game.players = _.shuffle(game.players);
    game.players = game.players.map((player, index) => ({
      ...player,
      color: colors[index],
    }));
    game.currentPlayerIndex = 0;
    _io.to(game.gameId).emit('gameStarted', { gameData: game });
  }
}

function onHostGameEnd() {
  const game = _.find(gamesList, ['hostId', this.id]);
  if (game) {
    console.log('found the game for this host', game.gameId);
    game.state = 'ended';
    _io.to(game.gameId).emit('gameEnded', { gameData: game });
  }
}

function onJoinGame(params) {
  const game = gamesList[params.gameId];

  if (game) {
    const player = _.find(game.players, ['name', params.username]);
    if (player) {
      console.log('player reconnected', params.gameId, params.username);
      player.id = this.id;
      this.join(params.gameId);
      _io.to(game.gameId).emit('playerReconnected', {
        username: params.username,
        gameData: game,
      });
    } else if (game.state === 'notStarted') {
      console.log('player joined game', params.gameId, params.username);
      game.players.push({ id: this.id, name: params.username });
      this.join(params.gameId);
      _io.to(game.gameId).emit('playerJoinedGame', {
        username: params.username,
        gameData: game,
      });
    } else {
      console.log('game', params.gameId, 'already started');
      this.emit('alreadyStarted', params.gameId);
    }
  } else {
    console.log('game', params.gameId, 'not found');
    this.emit('notFound', params.gameId);
  }
}

function onPlayerDrawFinished(params) {
  console.log('player finished drawing', this.id);

  const game = gamesList[params.gameId];
  if (game) {
    if (this.id === game.players[game.currentPlayerIndex].id) {
      game.currentPlayerIndex++;
      if (game.currentPlayerIndex >= game.players.length) {
        game.currentPlayerIndex = 0;
        game.round++;
        if (game.round > 1) {
          game.state = 'drawingEnded';
        }
      }
      _io.to(game.gameId).emit('gameUpdated', { gameData: game });
    } else {
      console.log(
        'its not this players turn',
        this.id,
        game.players[game.currentPlayerIndex].id
      );
      this.emit('notYourTurn');
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
