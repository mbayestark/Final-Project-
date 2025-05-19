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

// Three Men's Morris specific functions
function checkWinner(board) {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return null;
}

function getValidMoves(position, board) {
  return ADJACENCY[position].filter(pos => board[pos] === null);
}

function createGame(vsComputer = false, computerDifficulty = 'medium') {
  return {
    board: Array(9).fill(null),
    currentPlayer: 'X',
    phase: 'placing',
    piecesPlaced: { X: 0, O: 0 },
    selectedPiece: null,
    vsComputer: vsComputer || false,
    computerDifficulty: computerDifficulty || 'medium',
    lastActivity: Date.now(),
    createdAt: Date.now()
  };
}

function placePiece(game, position, player) {
  if (game.board[position] !== null || game.winner || game.phase !== 'placing') {
    return { error: 'Invalid move' };
  }

  game.board[position] = player;
  game.piecesPlaced[player]++;
  game.lastActivity = Date.now();

  const winner = checkWinner(game.board);
  if (winner) {
    game.winner = winner;
    return { game };
  }

  if (game.piecesPlaced.X === 3 && game.piecesPlaced.O === 3) {
    game.phase = 'moving';
  }

  game.currentPlayer = player === 'X' ? 'O' : 'X';
  return { game };
}

function selectPiece(game, position, player) {
  if (game.phase !== 'moving' || game.board[position] !== player) {
    return { error: 'Invalid piece selection' };
  }

  const validMoves = getValidMoves(position, game.board);
  if (validMoves.length === 0) {
    return { error: 'No valid moves for selected piece' };
  }

  game.selectedPiece = parseInt(position);
  game.lastActivity = Date.now();
  return { game, validMoves };
}

function movePiece(game, fromPosition, toPosition, player) {
  if (game.phase !== 'moving') {
    return { error: 'Game not in moving phase' };
  }
  if (game.board[fromPosition] !== player) {
    return { error: 'Not current player\'s piece' };
  }
  if (game.board[toPosition] !== null) {
    return { error: 'Destination position is occupied' };
  }
  if (!ADJACENCY[fromPosition].includes(Number(toPosition))) {
    return { error: 'Invalid move - positions not adjacent' };
  }

  game.board[toPosition] = player;
  game.board[fromPosition] = null;
  game.selectedPiece = null;
  game.lastActivity = Date.now();

  const winner = checkWinner(game.board);
  if (winner) {
    game.winner = winner;
    return { game };
  }

  game.currentPlayer = player === 'X' ? 'O' : 'X';
  return { game };
}

module.exports = {
  createGame,
  placePiece,
  selectPiece,
  movePiece,
  checkWinner,
  getValidMoves
};
