# Game Hub - Tic Tac Toe & Three Men's Morris

A web application featuring two classic strategy games: Tic Tac Toe and Three Men's Morris. Built using HTML/CSS/JavaScript for the frontend and Node.js with Express and Socket.IO for the backend.

## 🎮 Games Overview

### Tic Tac Toe
A classic 3x3 grid game where players take turns marking spaces with X and O. The first player to get three marks in a row (horizontally, vertically, or diagonally) wins.

### Three Men's Morris
An ancient strategy game played on a 3x3 grid. Each player has three pieces, and the goal is to align them in a straight line. The game has two phases: placing and moving.

## 📁 Project Structure
```
project-root/
├── public/
│   ├── index.html         # Main dashboard
│   ├── tic.html           # Tic Tac Toe game
│   └── 3p.html            # Three Men's Morris game
├── server.js              # Combined server for both games
└── README.md              # This documentation
```

## 🖥️ Server Implementation (server.js)

The server handles both games using a unified architecture:

### Core Features
- Express server with Socket.IO for real-time gameplay
- Winston logger for debugging and monitoring
- In-memory game storage for both games
- CORS enabled for cross-origin requests
- Static file serving for the frontend

### Game Storage
```javascript
const games = {
  tictactoe: {},  // Tic Tac Toe games
  threemens: {}   // Three Men's Morris games
};
```

### Socket.IO Events
Both games support online multiplayer through Socket.IO:

#### Tic Tac Toe Events
- `joinOnlineGame`: Match players for online games
- `makeOnlineMove`: Handle online moves
- `updateOnlineGame`: Broadcast game state updates

#### Three Men's Morris Events
- `joinOnlineGame3`: Match players for online games
- `placeOnline3`: Handle piece placement
- `selectOnline3`: Handle piece selection
- `moveOnline3`: Handle piece movement
- `updateOnlineGame3`: Broadcast game state updates

## 🎯 Game Logic

### Tic Tac Toe

#### Board Representation
- 3x3 grid represented as a 1D array of length 9
- Empty cells are `null`, occupied cells are 'X' or 'O'

#### Winning Conditions
```javascript
const lines = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];
```

#### Computer AI
The computer AI uses a simple strategy:
1. Try to win in one move
2. Block opponent's winning move
3. Take center if available
4. Take a corner if available
5. Take any available space

### Three Men's Morris

#### Game Phases
1. **Placing Phase**
   - Players take turns placing their three pieces
   - After all pieces are placed, game moves to Moving Phase

2. **Moving Phase**
   - Players move their pieces to adjacent empty positions
   - Movement is restricted by the adjacency map

#### Board Representation
- 3x3 grid represented as a 1D array of length 9
- Empty positions are `null`, occupied are 'X' or 'O'

#### Adjacency Map
```javascript
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
```

#### Winning Conditions
```javascript
const WIN_PATTERNS = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // Rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // Columns
  [0, 4, 8], [2, 4, 6]             // Diagonals
];
```

#### Computer AI
The computer AI has three difficulty levels:

1. **Easy**
   - Random valid moves
   - No strategic planning

2. **Medium**
   - Tries to win in one move
   - Takes center when available
   - Random moves otherwise

3. **Hard**
   - Tries to win in one move
   - Blocks opponent's winning moves
   - Takes center when available
   - Takes corners strategically
   - Plans moves ahead

## 🚀 Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node 3p.js
   ```

3. Open `http://localhost:3002` in your browser

## 🎮 Game Modes

Both games support:
- Local multiplayer (Player vs Player)
- Computer opponent (with difficulty levels)
- Online multiplayer (real-time)

## 🔍 Debugging

The server uses Winston for logging:
- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output for real-time monitoring

## 🛠️ Technologies Used

- Frontend: HTML5, CSS3, JavaScript
- Backend: Node.js, Express
- Real-time: Socket.IO
- Logging: Winston
- Package Management: npm

## 📝 License

© 2024 Game Hub. All rights reserved.
