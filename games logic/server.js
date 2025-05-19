const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const path = require('path');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory game storage
const games = {
  tictactoe: {},
  threemens: {}
};
let waitingPlayers = {
  tictactoe: null,
  threemens: null
};

// Three Men's Morris specific constants
const ADJACENCY = {
  '0': [1, 3],
  '1': [0, 2, 4],
  '2': [1, 5],
  '3': [0, 4, 6],
  '4': [1, 3, 5, 7],
  '5': [2, 4, 8],
  '6': [3, 7],
  '7': [4, 6, 8],
  '8': [5, 7]
};

const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6]
];

// Tic Tac Toe specific functions
function checkTicTacToeWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (let [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : 'Draw';
}

function getBestTicTacToeMove(board, player) {
  const opponent = player === 'X' ? 'O' : 'X';
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = player;
      if (checkTicTacToeWinner(board) === player) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  for (let i = 0; i < 9; i++) {
    if (!board[i]) {
      board[i] = opponent;
      if (checkTicTacToeWinner(board) === opponent) {
        board[i] = null;
        return i;
      }
      board[i] = null;
    }
  }
  if (!board[4]) return 4;
  const corners = [0, 2, 6, 8];
  for (let i of corners) {
    if (!board[i]) return i;
  }
  return board.findIndex(cell => cell === null);
}

// Three Men's Morris specific functions
function checkThreeMensWinner(board) {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

// Tic Tac Toe Routes
app.post('/start', (req, res) => {
  const mode = req.body.mode;
  const id = Date.now().toString();

  if (mode === 'computer' || mode === 'local') {
    games.tictactoe[id] = {
      board: Array(9).fill(null),
      currentPlayer: 'X',
      winner: null,
      gameMode: mode
    };
    res.json({ gameId: id, board: games.tictactoe[id].board });
  } else {
    res.json({ message: 'Use WebSocket to start online mode' });
  }
});

app.post('/move', (req, res) => {
  const { gameId, index, player } = req.body;
  const game = games.tictactoe[gameId];

  if (!game) return res.status(404).json({ error: 'Game not found' });
  if (game.board[index] !== null || game.winner || game.currentPlayer !== player)
    return res.status(400).json({ error: 'Invalid move' });

  game.board[index] = player;
  game.winner = checkTicTacToeWinner(game.board);
  game.currentPlayer = player === 'X' ? 'O' : 'X';

  if (game.gameMode === 'computer' && !game.winner && game.currentPlayer === 'O') {
    const compMove = getBestTicTacToeMove(game.board, 'O');
    game.board[compMove] = 'O';
    game.winner = checkTicTacToeWinner(game.board);
    game.currentPlayer = 'X';
  }

  res.json({ board: game.board, winner: game.winner, nextPlayer: game.currentPlayer });
});

// Three Men's Morris Routes
app.post('/start3', (req, res) => {
  const gameId = uuidv4();
  const { vsComputer, computerDifficulty } = req.body;
  
  logger.info('Starting new Three Men\'s Morris game', { gameId, vsComputer, computerDifficulty });
  
  games.threemens[gameId] = {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    phase: 'placing',
    piecesPlaced: { X: 0, O: 0 },
    selectedPiece: null,
    vsComputer: vsComputer || false,
    computerDifficulty: computerDifficulty || 'medium'
  };
  
  res.json({ gameId, game: games.threemens[gameId] });
});

// Socket.IO connection handling
io.on('connection', socket => {
  logger.info('New client connected', { socketId: socket.id });

  // Tic Tac Toe online game handling
  socket.on('joinOnlineGame', () => {
    if (waitingPlayers.tictactoe) {
      const gameId = Date.now().toString();
      games.tictactoe[gameId] = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        winner: null,
        players: {
          X: waitingPlayers.tictactoe,
          O: socket
        }
      };

      waitingPlayers.tictactoe.emit('startOnlineGame', { gameId, mark: 'X' });
      socket.emit('startOnlineGame', { gameId, mark: 'O' });
      waitingPlayers.tictactoe = null;
    } else {
      waitingPlayers.tictactoe = socket;
    }
  });

  socket.on('makeOnlineMove', ({ gameId, index, player }) => {
    const game = games.tictactoe[gameId];
    if (!game || game.board[index] !== null || game.winner || game.currentPlayer !== player) return;

    game.board[index] = player;
    game.winner = checkTicTacToeWinner(game.board);
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

  // Three Men's Morris online game handling
  socket.on('joinOnlineGame3', () => {
    logger.info('Player joining Three Men\'s Morris game', { socketId: socket.id });
    if (waitingPlayers.threemens) {
      const gameId = uuidv4();
      const gameState = {
        board: Array(9).fill(null),
        currentPlayer: 'X',
        phase: 'placing',
        piecesPlaced: { X: 0, O: 0 },
        selectedPiece: null,
        winner: null,
        players: {
          X: waitingPlayers.threemens,
          O: socket
        }
      };
      
      games.threemens[gameId] = gameState;

      logger.info('Three Men\'s Morris game started', { gameId, playerX: waitingPlayers.threemens.id, playerO: socket.id });
      waitingPlayers.threemens.emit('startOnlineGame3', { gameId, mark: 'X' });
      socket.emit('startOnlineGame3', { gameId, mark: 'O' });
      waitingPlayers.threemens = null;
    } else {
      waitingPlayers.threemens = socket;
      logger.info('Player waiting for Three Men\'s Morris opponent', { socketId: socket.id });
    }
  });

  socket.on('placeOnline3', ({ gameId, position }) => {
    logger.debug('Three Men\'s Morris place move received', { gameId, position, socketId: socket.id });
    const game = games.threemens[gameId];
    if (!game || !game.players) {
      logger.error('Game not found or invalid', { gameId, socketId: socket.id });
      return;
    }
    if (game.board[position] !== null || game.winner || game.phase !== 'placing') {
      logger.warn('Invalid place move', { gameId, position, socketId: socket.id });
      return;
    }

    game.board[position] = game.currentPlayer;
    game.piecesPlaced[game.currentPlayer]++;

    const winner = checkThreeMensWinner(game.board);
    if (winner) {
      game.winner = winner;
      const gameState = { ...game };
      delete gameState.players;
      logger.info('Game won', { gameId, winner });
      game.players.X.emit('updateOnlineGame3', { game: gameState });
      game.players.O.emit('updateOnlineGame3', { game: gameState });
      return;
    }

    if (game.piecesPlaced.X === 3 && game.piecesPlaced.O === 3) {
      game.phase = 'moving';
      logger.info('Game phase changed to moving', { gameId });
    }

    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

    const gameState = { ...game };
    delete gameState.players;
    logger.debug('Sending updated game state after place', { gameId });
    game.players.X.emit('updateOnlineGame3', { game: gameState });
    game.players.O.emit('updateOnlineGame3', { game: gameState });
  });

  socket.on('selectOnline3', ({ gameId, position }) => {
    logger.debug('Three Men\'s Morris select piece received', { gameId, position, socketId: socket.id });
    const game = games.threemens[gameId];
    if (!game || !game.players) {
      logger.error('Game not found or invalid', { gameId, socketId: socket.id });
      return;
    }
    if (game.phase !== 'moving' || game.board[position] !== game.currentPlayer) {
      logger.warn('Invalid piece selection', { gameId, position, socketId: socket.id });
      return;
    }

    const validMoves = ADJACENCY[position].filter(pos => game.board[pos] === null);
    if (validMoves.length === 0) {
      logger.warn('No valid moves for selected piece', { gameId, position, socketId: socket.id });
      return;
    }

    game.selectedPiece = parseInt(position);
    logger.debug('Piece selected', { gameId, position, validMoves });

    const gameState = { ...game };
    delete gameState.players;
    game.players.X.emit('updateOnlineGame3', { game: gameState, validMoves });
    game.players.O.emit('updateOnlineGame3', { game: gameState, validMoves });
  });

  socket.on('moveOnline3', ({ gameId, fromPosition, toPosition }) => {
    logger.debug('Three Men\'s Morris move received', { gameId, fromPosition, toPosition, socketId: socket.id });
    const game = games.threemens[gameId];
    if (!game || !game.players) {
      logger.error('Game not found or invalid', { gameId, socketId: socket.id });
      return;
    }
    if (game.phase !== 'moving') {
      logger.warn('Game not in moving phase', { gameId, socketId: socket.id });
      return;
    }
    if (game.board[fromPosition] !== game.currentPlayer) {
      logger.warn('Not current player\'s piece', { gameId, fromPosition, socketId: socket.id });
      return;
    }
    if (game.board[toPosition] !== null) {
      logger.warn('Destination position is occupied', { gameId, toPosition, socketId: socket.id });
      return;
    }
    if (!ADJACENCY[fromPosition].includes(Number(toPosition))) {
      logger.warn('Invalid move - positions not adjacent', { gameId, fromPosition, toPosition, socketId: socket.id });
      return;
    }

    game.board[toPosition] = game.currentPlayer;
    game.board[fromPosition] = null;
    game.selectedPiece = null;

    const winner = checkThreeMensWinner(game.board);
    if (winner) {
      game.winner = winner;
      const gameState = { ...game };
      delete gameState.players;
      logger.info('Game won', { gameId, winner });
      game.players.X.emit('updateOnlineGame3', { game: gameState });
      game.players.O.emit('updateOnlineGame3', { game: gameState });
      return;
    }

    game.currentPlayer = game.currentPlayer === 'X' ? 'O' : 'X';

    const gameState = { ...game };
    delete gameState.players;
    logger.debug('Sending updated game state after move', { gameId });
    game.players.X.emit('updateOnlineGame3', { game: gameState });
    game.players.O.emit('updateOnlineGame3', { game: gameState });
  });

  socket.on('disconnect', () => {
    logger.info('Client disconnected', { socketId: socket.id });
    
    // Clean up Tic Tac Toe games
    if (waitingPlayers.tictactoe === socket) {
      waitingPlayers.tictactoe = null;
    }
    
    // Clean up Three Men's Morris games
    if (waitingPlayers.threemens === socket) {
      waitingPlayers.threemens = null;
    }
    
    // Clean up any active games
    Object.entries(games.tictactoe).forEach(([gameId, game]) => {
      if (game.players && (game.players.X === socket || game.players.O === socket)) {
        const otherPlayer = game.players.X === socket ? game.players.O : game.players.X;
        if (otherPlayer) {
          otherPlayer.emit('updateOnlineGame', { 
            board: game.board,
            winner: game.players.X === socket ? 'O' : 'X',
            currentPlayer: null
          });
        }
        delete games.tictactoe[gameId];
      }
    });

    Object.entries(games.threemens).forEach(([gameId, game]) => {
      if (game.players && (game.players.X === socket || game.players.O === socket)) {
        const otherPlayer = game.players.X === socket ? game.players.O : game.players.X;
        if (otherPlayer) {
          otherPlayer.emit('updateOnlineGame3', { 
            game: { 
              ...game, 
              winner: game.players.X === socket ? 'O' : 'X',
              players: undefined 
            } 
          });
        }
        delete games.threemens[gameId];
      }
    });
  });
});

server.listen(PORT, () => logger.info(`Server running on http://localhost:${PORT}`));
