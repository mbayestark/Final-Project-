// server.js
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*'
  }
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let games = {};
let waitingPlayer = null;

// Game constants
const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];

// Game logic functions
function checkWinner(board) {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'Draw';
}

function getBestMove(board, player) {
  const opponent = player === 'X' ? 'O' : 'X';
  
  // Try to win
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
  
  // Block opponent
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
  
  // Take center
  if (!board[4]) return 4;
  
  // Take corners
  const corners = [0, 2, 6, 8];
  for (let i of corners) {
    if (!board[i]) return i;
  }
  
  // Take any available space
  return board.findIndex(cell => cell === null);
}

// Game state management
function createGame(vsComputer = false, computerDifficulty = 'medium') {
  return {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    winner: null,
    vsComputer,
    computerDifficulty,
    lastActivity: Date.now(),
    createdAt: Date.now()
  };
}

function makeMove(game, position, player) {
  if (game.board[position] !== null || game.winner || game.currentPlayer !== player) {
    return { error: 'Invalid move' };
  }

  game.board[position] = player;
  game.winner = checkWinner(game.board);
  game.currentPlayer = player === 'X' ? 'O' : 'X';
  game.lastActivity = Date.now();

  if (game.vsComputer && !game.winner && game.currentPlayer === 'O') {
    const compMove = getBestMove(game.board, 'O');
    game.board[compMove] = 'O';
    game.winner = checkWinner(game.board);
    game.currentPlayer = 'X';
  }

  return { game };
}

app.post('/start', (req, res) => {
  const mode = req.body.mode;
  const id = Date.now().toString();

  if (mode === 'computer' || mode === 'local') {
    games[id] = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameMode: mode
    };
    res.json({ gameId: id, board: games[id].board });
  } else {
    res.json({ message: 'Use WebSocket to start online mode' });
  }
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

  if (game.gameMode === 'computer' && !game.winner && game.currentPlayer === 'O') {
    const compMove = getBestMove(game.board, 'O');
    game.board[compMove] = 'O';
    game.winner = checkWinner(game.board);
    game.currentPlayer = 'X';
  }

  res.json({ board: game.board, winner: game.winner, nextPlayer: game.currentPlayer });
});

io.on('connection', socket => {
  socket.on('joinOnlineGame', () => {
    if (waitingPlayer) {
      const gameId = Date.now().toString();
      games[gameId] = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        players: {
          X: waitingPlayer,
          O: socket
        }
      };

      waitingPlayer.emit('startOnlineGame', { gameId, mark: 'X' });
      socket.emit('startOnlineGame', { gameId, mark: 'O' });
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on('makeOnlineMove', ({ gameId, index, player }) => {
    const game = games[gameId];
    if (!game || game.board[index] !== null || game.winner || game.currentPlayer !== player) return;

    game.board[index] = player;
    game.winner = checkWinner(game.board);
    game.currentPlayer = player === 'X' ? 'O' : 'X';

    game.players.X.emit('updateOnlineGame', {
      board: game.board,
      winner: game.winner,
      currentPlayer: game.currentPlayer
    });
    game.players.O.emit('updateOnlineGame', {
      board: game.board,
      winner: game.winner,
      currentPlayer: game.currentPlayer
    });
  });

  socket.on('disconnect', () => {
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

const PORT = 3002;
server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

module.exports = {
  createGame,
  makeMove,
  checkWinner,
  getBestMove
};
