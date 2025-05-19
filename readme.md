# Game Hub - Tic Tac Toe & Three Men's Morris

A modern web application featuring two classic board games with both local and online multiplayer capabilities.

## 🎮 Games Overview

### Tic Tac Toe
- Classic 3x3 grid game
- Players take turns placing X and O marks
- Win by getting three in a row (horizontally, vertically, or diagonally)
- Features computer AI with adjustable difficulty levels

### Three Men's Morris
- Ancient strategy game with two phases
- Players start by placing three pieces each
- After placement, pieces move along adjacent points
- Win by forming a line of three pieces
- Features computer AI with adjustable difficulty levels

## 🏗️ Project Structure

```
├── public/
│   ├── index.html      # Main dashboard
│   ├── tic.html        # Tic Tac Toe game interface
│   └── 3p.html         # Three Men's Morris game interface
├── tic.js              # Tic Tac Toe game logic module
├── 3p.js               # Three Men's Morris game logic module
├── server.js           # Central server implementation
└── package.json        # Project dependencies
```

## 🚀 Server Implementation

The server is built using Express and Socket.IO, providing a unified backend for both games.

### Core Features
- Centralized game state management
- Real-time multiplayer support
- Computer AI integration
- Automatic game cleanup
- Comprehensive error handling
- Detailed logging system

### Game Storage
```javascript
const games = {
  tictactoe: {},  // Tic Tac Toe games
  threemens: {}   // Three Men's Morris games
};
```

### Socket.IO Events
- `joinOnlineGame` / `joinOnlineGame3`: Join online matchmaking
- `makeOnlineMove` / `placeOnline3`: Make game moves
- `selectOnline3`: Select piece (Three Men's Morris)
- `moveOnline3`: Move piece (Three Men's Morris)

## 🎯 Game Logic

### Tic Tac Toe
- Board representation: 3x3 array
- Winning patterns: 8 possible combinations
- Computer AI strategy:
  - Win if possible
  - Block opponent's winning move
  - Take center if available
  - Take corners
  - Take any available space

### Three Men's Morris
- Board representation: 9-point grid
- Game phases: placing and moving
- Adjacency rules for piece movement
- Winning patterns: 8 possible combinations
- Computer AI strategy:
  - Win if possible
  - Block opponent's winning move
  - Strategic piece placement
  - Optimal piece movement

## 🛠️ Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the server:
   ```bash
   node server.js
   ```

3. Access the games:
   - Main dashboard: `http://localhost:3002`
   - Tic Tac Toe: `http://localhost:3002/tic.html`
   - Three Men's Morris: `http://localhost:3002/3p.html`

## 🎲 Game Modes

### Local Play
- Play against a friend on the same device
- Take turns using the same interface

### Computer Opponent
- Play against AI with adjustable difficulty
- Three difficulty levels: easy, medium, hard

### Online Multiplayer
- Real-time gameplay with other players
- Automatic matchmaking system
- Synchronized game state
- Player disconnection handling

## 🔍 Debugging

The server includes comprehensive logging:
- Error logs: `error.log`
- Combined logs: `combined.log`
- Console output with color coding

## 🛡️ Error Handling

- Input validation for all moves
- Game state verification
- Player disconnection management
- Automatic game cleanup
- Global error handling

## 🛠️ Technologies Used

- **Backend:**
  - Node.js
  - Express
  - Socket.IO
  - Winston (logging)

- **Frontend:**
  - HTML5
  - CSS3
  - JavaScript
  - Socket.IO client

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.
