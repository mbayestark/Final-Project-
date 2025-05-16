const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));  // 'public' is the directory where your HTML and assets are

let games = {};

app.post('/start', (req, res) => {
  const mode = req.body.mode || 'player';
  const id = Date.now().toString();
  games[id] = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    gameMode: mode
  };
  res.json({ gameId: id, board: games[id].board });
});

app.post('/move', (req, res) => {
  const { gameId, index, player } = req.body;
  const game = games[gameId];

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.board[index] !== null || game.winner || game.currentPlayer !== player)
    return res.status(400).json({ error: 'Invalid move' });

  game.board[index] = player;
  game.winner = checkWinner(game.board);
  game.currentPlayer = player === 'X' ? 'O' : 'X';

  // Computer move if applicable
  if (game.gameMode === 'computer' && !game.winner && game.currentPlayer === 'O') {
    const compMove = getBestMove(game.board, 'O');
    game.board[compMove] = 'O';
    game.winner = checkWinner(game.board);
    game.currentPlayer = 'X';
  }

  res.json({ board: game.board, winner: game.winner, nextPlayer: game.currentPlayer });
});

function checkWinner(board) {
  const lines = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];
  for (let [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'Draw';
}

function getBestMove(board, player) {
  const opponent = player === 'X' ? 'O' : 'X';

  // 1. Win if possible
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player;
      if (checkWinner(board) === player) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // 2. Block opponent win
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = opponent;
      if (checkWinner(board) === opponent) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }

  // 3. Pick center
  if (!board[4]) return 4;

  // 4. Pick a corner
  const corners = [0, 2, 6, 8];
  for (let i of corners) {
    if (!board[i]) return i;
  }

  // 5. Pick any free space
  return board.findIndex(cell => cell === null);
}

const PORT = 3002;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
