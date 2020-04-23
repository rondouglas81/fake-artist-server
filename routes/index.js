const express = require('express');
const router = express.Router();
const GameManager = require('../gameManager');

router.get('/', (req, res) => {
  res.send({ response: 'I am alive' }).status(200);
});

router.post('/create', (req, res) => {
  const gameId = GameManager.createGame();

  console.log('creating new game with id', gameId);

  res.send({ gameId }).status(200);
});

module.exports = router;
