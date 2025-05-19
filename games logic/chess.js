// Chess game constants and logic
const CHESS_PIECES = {
  'white-pawn': { value: 10, symbol: '♙' },
  'white-knight': { value: 30, symbol: '♘' },
  'white-bishop': { value: 30, symbol: '♗' },
  'white-rook': { value: 50, symbol: '♖' },
  'white-queen': { value: 90, symbol: '♕' },
  'white-king': { value: 900, symbol: '♔' },
  'black-pawn': { value: 10, symbol: '♟' },
  'black-knight': { value: 30, symbol: '♞' },
  'black-bishop': { value: 30, symbol: '♝' },
  'black-rook': { value: 50, symbol: '♜' },
  'black-queen': { value: 90, symbol: '♛' },
  'black-king': { value: 900, symbol: '♚' }
};

function createGame(vsComputer = false, computerDifficulty = 'medium') {
  return {
    board: initializeBoard(),
    currentPlayer: 'white',
    winner: null,
    vsComputer,
    computerDifficulty,
    lastActivity: Date.now(),
    createdAt: Date.now(),
    moveHistory: [],
    capturedPieces: { white: [], black: [] }
  };
}

function initializeBoard() {
  // Initialize empty board
  const board = Array(8).fill(null).map(() => Array(8).fill(null));
  
  // Set up pawns
  for (let i = 0; i < 8; i++) {
    board[1][i] = 'black-pawn';
    board[6][i] = 'white-pawn';
  }
  
  // Set up other pieces
  const pieces = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
  pieces.forEach((piece, i) => {
    board[0][i] = `black-${piece}`;
    board[7][i] = `white-${piece}`;
  });
  
  return board;
}

function makeMove(game, fromPos, toPos) {
  const [fromRow, fromCol] = fromPos;
  const [toRow, toCol] = toPos;
  
  // Validate move
  if (!isValidMove(game, fromPos, toPos)) {
    return { error: 'Invalid move' };
  }
  
  // Capture piece if present
  if (game.board[toRow][toCol]) {
    game.capturedPieces[game.currentPlayer].push(game.board[toRow][toCol]);
  }
  
  // Make the move
  game.board[toRow][toCol] = game.board[fromRow][fromCol];
  game.board[fromRow][fromCol] = null;
  
  // Check for pawn promotion
  if (game.board[toRow][toCol].endsWith('pawn') && (toRow === 0 || toRow === 7)) {
    game.board[toRow][toCol] = `${game.currentPlayer}-queen`;
  }
  
  // Update game state
  game.moveHistory.push({ from: fromPos, to: toPos, piece: game.board[toRow][toCol] });
  game.currentPlayer = game.currentPlayer === 'white' ? 'black' : 'white';
  game.lastActivity = Date.now();
  
  // Check for checkmate
  if (isCheckmate(game)) {
    game.winner = game.currentPlayer === 'white' ? 'black' : 'white';
  }
  
  return { game };
}

function isValidMove(game, fromPos, toPos) {
  // Basic validation
  const [fromRow, fromCol] = fromPos;
  const [toRow, toCol] = toPos;
  
  if (fromRow < 0 || fromRow > 7 || fromCol < 0 || fromCol > 7 ||
      toRow < 0 || toRow > 7 || toCol < 0 || toCol > 7) {
    return false;
  }
  
  const piece = game.board[fromRow][fromCol];
  if (!piece || !piece.startsWith(game.currentPlayer)) {
    return false;
  }
  
  // TODO: Implement specific piece movement rules
  // For now, allow any move to an empty square or capture
  const targetPiece = game.board[toRow][toCol];
  return !targetPiece || targetPiece.startsWith(game.currentPlayer === 'white' ? 'black' : 'white');
}

function isCheckmate(game) {
  // TODO: Implement checkmate detection
  return false;
}

function getComputerMove(game) {
  // TODO: Implement computer move logic based on difficulty
  return null;
}

module.exports = {
  createGame,
  makeMove,
  isValidMove,
  isCheckmate,
  getComputerMove,
  CHESS_PIECES
};
