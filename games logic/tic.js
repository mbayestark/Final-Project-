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

module.exports = {
  createGame,
  makeMove,
  checkWinner,
  getBestMove
};
