const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const http = require('http');
const { Server } = require('socket.io');
const winston = require('winston');
const path = require('path');

// Import game modules
const ticTacToe = require('./tic');
const threeMens = require('./3p');

// Configure Winston logger
const logger = winston.createLogger({
  level: 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use. Please try a different port or stop the process using this port.`);
    logger.info('You can set a different port using: PORT=<port_number> node server.js');
    process.exit(1);
  }
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000
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

// Game cleanup interval (every 30 minutes)
setInterval(() => {
  const now = Date.now();
  Object.entries(games).forEach(([gameType, gameList]) => {
    Object.entries(gameList).forEach(([gameId, game]) => {
      if (game.lastActivity && (now - game.lastActivity > 1800000)) { // 30 minutes
        logger.info('Cleaning up inactive game', { gameType, gameId });
        if (game.players) {
          game.players.X?.emit('gameEnded', { reason: 'inactivity' });
          game.players.O?.emit('gameEnded', { reason: 'inactivity' });
        }
        delete games[gameType][gameId];
      }
    });
  });
}, 1800000);

// Tic Tac Toe Routes
app.post('/start', (req, res) => {
  try {
    const gameId = uuidv4();
    const { vsComputer, computerDifficulty } = req.body;
    
    logger.info('Starting new Tic Tac Toe game', { gameId, vsComputer, computerDifficulty });
    
    games.tictactoe[gameId] = ticTacToe.createGame(vsComputer, computerDifficulty);
    res.json({ gameId, game: games.tictactoe[gameId] });
  } catch (error) {
    logger.error('Error starting Tic Tac Toe game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

app.post('/move', (req, res) => {
  try {
    const { gameId, position, player } = req.body;
    const game = games.tictactoe[gameId];
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }

    const result = ticTacToe.makeMove(game, position, player);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }

    res.json(result.game);
  } catch (error) {
    logger.error('Error making Tic Tac Toe move:', error);
    res.status(500).json({ error: 'Failed to make move' });
  }
});

// Three Men's Morris Routes
app.post('/start3', (req, res) => {
  try {
    const gameId = uuidv4();
    const { vsComputer, computerDifficulty } = req.body;
    
    logger.info('Starting new Three Men\'s Morris game', { gameId, vsComputer, computerDifficulty });
    
    games.threemens[gameId] = threeMens.createGame(vsComputer, computerDifficulty);
    res.json({ gameId, game: games.threemens[gameId] });
  } catch (error) {
    logger.error('Error starting Three Men\'s Morris game:', error);
    res.status(500).json({ error: 'Failed to start game' });
  }
});

// Socket.IO connection handling
io.on('connection', socket => {
  logger.info('New client connected', { socketId: socket.id });

  // Tic Tac Toe online game handling
  socket.on('joinOnlineGame', () => {
    try {
      if (waitingPlayers.tictactoe) {
        const gameId = uuidv4();
        const game = ticTacToe.createGame(false);
        game.players = {
          X: waitingPlayers.tictactoe,
          O: socket
        };
        
        games.tictactoe[gameId] = game;

        waitingPlayers.tictactoe.emit('startOnlineGame', { gameId, mark: 'X' });
        socket.emit('startOnlineGame', { gameId, mark: 'O' });
        waitingPlayers.tictactoe = null;
      } else {
        waitingPlayers.tictactoe = socket;
      }
    } catch (error) {
      logger.error('Error in joinOnlineGame:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('makeOnlineMove', ({ gameId, position, player }) => {
    try {
      const game = games.tictactoe[gameId];
      if (!game || !game.players) {
        return;
      }

      const result = ticTacToe.makeMove(game, position, player);
      if (result.error) {
        return;
      }

      game.players.X.emit('updateOnlineGame', result.game);
      game.players.O.emit('updateOnlineGame', result.game);
    } catch (error) {
      logger.error('Error in makeOnlineMove:', error);
      socket.emit('error', { message: 'Failed to make move' });
    }
  });

  // Three Men's Morris online game handling
  socket.on('joinOnlineGame3', () => {
    try {
      if (waitingPlayers.threemens) {
        const gameId = uuidv4();
        const game = threeMens.createGame(false);
        game.players = {
          X: waitingPlayers.threemens,
          O: socket
        };
        
        games.threemens[gameId] = game;

        waitingPlayers.threemens.emit('startOnlineGame3', { gameId, mark: 'X' });
        socket.emit('startOnlineGame3', { gameId, mark: 'O' });
        waitingPlayers.threemens = null;
      } else {
        waitingPlayers.threemens = socket;
      }
    } catch (error) {
      logger.error('Error in joinOnlineGame3:', error);
      socket.emit('error', { message: 'Failed to join game' });
    }
  });

  socket.on('placeOnline3', ({ gameId, position }) => {
    try {
      const game = games.threemens[gameId];
      if (!game || !game.players) {
        return;
      }

      const result = threeMens.placePiece(game, position, game.currentPlayer);
      if (result.error) {
        return;
      }

      game.players.X.emit('updateOnlineGame3', { game: result.game });
      game.players.O.emit('updateOnlineGame3', { game: result.game });
    } catch (error) {
      logger.error('Error in placeOnline3:', error);
      socket.emit('error', { message: 'Failed to place piece' });
    }
  });

  socket.on('selectOnline3', ({ gameId, position }) => {
    try {
      const game = games.threemens[gameId];
      if (!game || !game.players) {
        return;
      }

      const result = threeMens.selectPiece(game, position, game.currentPlayer);
      if (result.error) {
        return;
      }

      game.players.X.emit('updateOnlineGame3', { game: result.game, validMoves: result.validMoves });
      game.players.O.emit('updateOnlineGame3', { game: result.game, validMoves: result.validMoves });
    } catch (error) {
      logger.error('Error in selectOnline3:', error);
      socket.emit('error', { message: 'Failed to select piece' });
    }
  });

  socket.on('moveOnline3', ({ gameId, fromPosition, toPosition }) => {
    try {
      const game = games.threemens[gameId];
      if (!game || !game.players) {
        return;
      }

      const result = threeMens.movePiece(game, fromPosition, toPosition, game.currentPlayer);
      if (result.error) {
        return;
      }

      game.players.X.emit('updateOnlineGame3', { game: result.game });
      game.players.O.emit('updateOnlineGame3', { game: result.game });
    } catch (error) {
      logger.error('Error in moveOnline3:', error);
      socket.emit('error', { message: 'Failed to move piece' });
    }
  });

  socket.on('disconnect', () => {
    try {
      logger.info('Client disconnected', { socketId: socket.id });
      
      // Clean up waiting players
      if (waitingPlayers.tictactoe === socket) {
        waitingPlayers.tictactoe = null;
      }
      if (waitingPlayers.threemens === socket) {
        waitingPlayers.threemens = null;
      }
      
      // Clean up active games
      Object.entries(games).forEach(([gameType, gameList]) => {
        Object.entries(gameList).forEach(([gameId, game]) => {
          if (game.players && (game.players.X === socket || game.players.O === socket)) {
            const otherPlayer = game.players.X === socket ? game.players.O : game.players.X;
            if (otherPlayer) {
              const event = gameType === 'tictactoe' ? 'updateOnlineGame' : 'updateOnlineGame3';
              otherPlayer.emit(event, { 
                game: { 
                  ...game, 
                  winner: game.players.X === socket ? 'O' : 'X',
                  players: undefined 
                } 
              });
            }
            delete games[gameType][gameId];
            logger.info('Game cleaned up after player disconnect', { gameType, gameId });
          }
        });
      });
    } catch (error) {
      logger.error('Error in disconnect handler:', error);
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server with error handling
server.listen(PORT, () => {
  logger.info(`Server running on http://localhost:${PORT}`);
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${error.port} is already in use. Please try a different port or stop the process using this port.`);
    logger.info('You can set a different port using: PORT=<port_number> node server.js');
    process.exit(1);
  } else {
    logger.error('Server error:', error);
    process.exit(1);
  }
});

// Remove any console.log statements
console.log = () => {};
