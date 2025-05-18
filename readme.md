# I-Tic Tac Toe - Web App

A simple Tic-Tac-Toe game with two modes: Player vs Player and Player vs Computer. Built using HTML/CSS/JavaScript for the frontend and Node.js with Express for the backend.

🧠 Project Structure and Logic

📁 Folder Structure
project-root/
│
├── public/
│   └── index.html          // Frontend HTML, CSS, and JavaScript
│
├── server.js               // Backend logic using Express
└── README.md               // This file

🌐 Frontend Logic (public/index.html)

HTML Elements
Landing Page: Displays a welcome message and a "Start Game" button.
Mode Selection: Lets user choose to play against another player or the computer.
Game Board: A 3x3 grid generated dynamically in JavaScript.
End Game Modal: Shows result and options to restart or go back to the menu.
JavaScript Logic
1. showModeSelection()
Hides landing page
Displays opponent selection menu

2. startGame(selectedMode)
Sends a POST request to the server to create a new game (/start)
Receives gameId and initial empty board
Initializes player as 'X' and shows the game board

3. drawBoard(board)
Clears and re-renders the 3x3 board based on current game state
Each cell is clickable and triggers makeMove(index)

4. makeMove(index)
Sends the current move to the server (/move)
Server checks validity, updates board, handles computer logic if needed
Updates UI and displays winner if there is one

5. showEndModal(message), restartGame(), backToMenu()
Handle end-of-game modal logic: display result, restart, or return to menu
🖥️ Backend Logic (server.js)

# Server Setup
Uses express, cors, and path
Serves static files from /public
Parses incoming JSON requests
Endpoints

# POST /start

Initializes a new game:
Generates unique gameId using timestamp
Sets board to 9 empty cells
Sets currentPlayer to 'X'
Saves game state in games object (in-memory)
Returns the game ID and empty board

# POST /move

Receives: gameId, index, player
Validates:
Game exists
Cell is not already played
It's the correct player's turn
Updates board and checks for a winner
If mode is 'computer' and it's the computer's turn, makes the best move using getBestMove()
Responds with updated board, winner (if any), and next player


# ♟️ Game Logic # 

# checkWinner(board)
Checks all winning combinations (rows, columns, diagonals)
Returns:
'X' or 'O' if someone won
'Draw' if board is full and no winner
null if game is still ongoing


## getBestMove(board, player)
Simple AI logic for the computer:

Try to win in the next move
Block opponent's winning move
Take the center if free
Take any corner
Take any available cell



# II-Three Men's Morris #

A classic strategy board game for two players, implemented as a web application with a client-server architecture.


## Game Overview

Three Men's Morris ("Le moulin à trois" in French) is played on a 3×3 grid. Each player has three pieces. The goal is to align your three pieces in a straight line (horizontal, vertical, or diagonal).

Gameplay consists of two phases:

1. **Placing Phase**: Players take turns placing their three pieces on empty positions.
2. **Moving Phase**: Once all pieces are placed, players move one of their pieces to an adjacent empty position.

## Project Structure

```
project-root/
├── public/               # Frontend HTML, CSS, JavaScript
│   └── 3p.html
├── 3p.js             # Express backend
└── README.md             # This documentation
```

## Game Phases

### Placing Phase

* Each player alternately places one of their three pieces on an empty position.
* After placement, the server checks for a win. If none and all pieces placed, transition to Moving Phase.

### Moving Phase

* Players alternately select one of their pieces and move it to an adjacent empty position.
* A valid move is determined by the adjacency map.
* After each move, the server checks for a win.

## Server Endpoints

* `POST /start3`

  * Request: `{ vsComputer: boolean, computerDifficulty: string }`
  * Response: `{ gameId, game }` where `game` contains board, currentPlayer, phase, etc.

* `POST /place`

  * Places a piece during the Placing Phase.
  * Request: `{ gameId, position }`
  * Response: `{ game }`

* `POST /select`

  * Selects a piece to move in the Moving Phase.
  * Request: `{ gameId, position }`
  * Response: `{ game, validMoves }`

* `POST /move3`

  * Moves a selected piece to a new position.
  * Request: `{ gameId, fromPosition, toPosition }`
  * Response: `{ game }`

* `POST /computer-move`

  * Computes and executes the computer's move based on difficulty.
  * Request: `{ gameId, difficulty }`
  * Response: `{ game }`

## Core Logic

### Board Representation

* The board is a 1D array of length 9, indices 0–8 correspond to positions:

  ```
  ```

0 | 1 | 2
\--+---+--
3 | 4 | 5
\--+---+--
6 | 7 | 8

```
- Empty positions are `null`, occupied are `'X'` or `'O'`.

### Winning Conditions
- Predefined `WIN_PATTERNS` list of index triplets for all lines:
- Rows `[0,1,2], [3,4,5], [6,7,8]`
- Columns `[0,3,6], [1,4,7], [2,5,8]`
- Diagonals `[0,4,8], [2,4,6]`
- A win occurs if any pattern has the same non-null value at all three positions.

###  Adjacency Map
- `ADJACENCY` object maps each index to an array of adjacent indices.
- Used to validate legal moves in Moving Phase.

## Computer AI

### Placing AI
- **Hard** difficulty:
1. Try to win in one move (`findWinningMove`).
2. Block opponent's winning move.
3. Take center (position 4).
4. Take a random corner.
- **Medium**: same as Hard minus blocking logic.
- **Easy**: random placement.

### Moving AI
- **Hard/Medium**:
1. Look for a winning move by simulating each valid move.
2. (Hard) Attempt strategic moves: center or corners.
- **Easy**: random valid move.

## UI Interaction
- Frontend fetches endpoints to start game, place, select, move, and computer moves.
- UI updates board, highlights valid moves, and displays status and modals.

---
Enjoy playing Three Men's Morris!

```


# III-Chess Game Documentation ♟️

## Overview
A complete chess implementation with two-player and AI modes, featuring move validation, check detection, and three difficulty levels. This single-page application uses vanilla JavaScript with drag-and-drop functionality.

## Core Functions

### 1. Game Initialization
```javascript
function startGame()
Purpose: Transitions from mode selection to game screen
Flow:
Hides mode buttons
Shows game board
Calls resetGame()
javascript
function resetGame()
Reset Process:
Clears board state
Reinitializes:
boardSquaresArray (2D game state)
moveHistory (undo stack)
Turn system (isWhiteTurn)
Rebuilds DOM elements
2. Board Setup

javascript
function createChessBoard()
DOM Creation:
Generates 8x8 grid with coordinates
Alternates square colors
Sets IDs (a1-h8 format)
javascript
function setupPieces()
Initialization:
Places 32 pieces in starting positions
Uses getPieceImagePath() for SVG paths
Sets drag event listeners
3. Drag & Drop System

javascript
function drag(ev)
Validation:
Turn verification
Computer turn blocking
Highlights legal moves via getPossibleMoves()
javascript
function drop(ev)
Move Execution:
Validates against precomputed legal moves
Calls executeMove()
Handles AI turn triggering
4. Move Processing

javascript
function executeMove(start, end, piece)
Critical Actions:
King position tracking
Piece capture handling
Pawn promotion detection
Turn switching
Checkmate verification
javascript
function getPossibleMoves()
Piece-Specific Delegation:
javascript
getPawnMoves()    // Includes en passant skeleton
getKnightMoves()   // L-shaped patterns
getBishopMoves()   // Diagonal sliding
getRookMoves()     // Straight sliding 
getQueenMoves()    // Combined bishop+rook
getKingMoves()     // 1-square moves (castling TODO)
5. Game State Management

javascript
function saveGameState()
Undo System:
Snapshots:
Board array
Turn state
King positions
Stores in moveHistory stack
javascript
function updateGameStatus()
Real-Time Updates:
Turn indicator
Check detection via isKingInCheck()
King square highlighting
6. AI System

javascript
function makeComputerMove()
Difficulty Flow:
Easy: Random valid moves
Medium: Prioritizes captures/checks
Hard: Board evaluation with:
javascript
evaluateBoard() // Material + position analysis
getPositionBonus() // Piece-specific positioning
javascript
function chooseBestMove()
Minimax-like Approach:
Simulates all possible moves
Scores resulting positions
Selects highest-scoring move
Key Algorithms

Check Detection

javascript
function isKingInCheck()
Process:
Identify opponent pieces
Calculate their attack paths
Verify king square in attack paths
Move Validation

javascript
function isMoveValidAgainstCheck()
Safety Check:
Board state simulation
King position tracking
Check verification post-move
Data Structures

Board Representation

javascript
boardSquaresArray = [
  {
    squareId: "a1",
    pieceColor: "white",
    pieceType: "rook",
    pieceId: "rook-a1"
  },
  // ...63 elements
]
Move History

javascript
moveHistory = [
  {
    boardState: [...],
    isWhiteTurn: true,
    whiteKingSquare: "e1",
    blackKingSquare: "e8"
  }
]
UI Components

Visual Features

Highlight System:
css
.highlight { background: rgba(255,253,120,0.5) }
.check { background: rgba(255,0,0,0.3) }
Responsive Design:
Flexbox layout
Viewport scaling
Mobile-optimized coordinates
Alert System

javascript
function showAlert()
Features:
Centered positioning
3-second timeout
Checkmate notifications
Limitations & TODOs

Missing Features:
Castling
En passant
Draw conditions
Pawn promotion choice
Optimization Targets:
Move generation efficiency
AI depth limitations
Board state cloning
Execution Flow

Initialization:
createChessBoard() → setupPieces() → fillBoardSquaresArray()
Player Move:
drag() → drop() → executeMove() → checkForCheckMate()
AI Move:
makeComputerMove() → evaluateBoard() → executeMove(
