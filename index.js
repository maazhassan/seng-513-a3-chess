/* Course: SENG 513 */
/* Date: OCT 23, 2023 */
/* Assignment 2 */
/* Name: Maaz Hassan */
/* UCID: 30087059 */

// Piece encodings
const NONE = 0;
const KING = 1;
const PAWN = 2;
const KNIGHT = 3;
const BISHOP = 4;
const ROOK  = 5;
const QUEEN = 6;
const WHITE = 8;
const BLACK = 16;
const TYPE_MASK = 0b00111;
const COLOR_MASK = 0b11000;

// Constants for easier move generation
const directionOffsets = [8, -8, -1, 1, 7, -7, 9, -9]; // N, S, W, E, NW, SE, NE, SW
const numSquaresToEdge = []; // 2D, each element is an array of size 8

// Flags for special move types
const MOVE_FLAG_PROMOTION = 1;
const MOVE_FLAG_ENPASSANT = 2;
const MOVE_FLAG_PAWN_TWO = 3;
const MOVE_FLAG_CASTLING = 4;

// Move object for storing move data - start and end square indices
function Move(startSquare, endSquare, flag = 0) {
  this.startSquare = startSquare;
  this.endSquare = endSquare;
  this.flag = flag;
}

// Array that stores all the valid moves for the current position
// Updated by generateMoves function
// Used by getMovesStartingAtSquare
let moves = []

let gameState = {
  // Array to represent the boardstate, 1D is probably fine
  // Order: bottom-left to top-right
  board: new Array(64),
  // Stores who's turn it currently is, probably initialized to either WHITE or BLACK (8/16)
  turnCol: WHITE,
  oppCol: BLACK,
  turnNum: 1,
  // Castling availability
  whiteCastlingKS: true,
  whiteCastlingQS: true,
  blackCastlingKS: true,
  blackCastlingQS: true,
  // En passant square index (0 can be used as none, because 0 is impossible)
  enpassantSquare: 0,
}

let prevGameState = null;

// Store the currently selected piece
let selectedPiece = null;

// Did we click on a piece that was selected (unselect if we mouseup on it again)
let clickedSelected = false;

// Are we currently dragging a piece
let mouseDownOnPiece = false;
let draggingPiece = false;

// Get coordinates of board for drag offset correction
const boardElement = document.getElementById("board");
const boardRect = boardElement.getBoundingClientRect();
const boardWidth = boardRect.right - boardRect.left;

// Get piece div width for drag offset correction
const pieceDivWidth = boardWidth / 8;

// Store divs for board information
const squares = document.getElementById("squares");
const highlights = document.getElementById("highlights");
const pieces = document.getElementById("pieces");
const moveHints = document.getElementById("move-hints");
const captureHints = document.getElementById("capture-hints");

const menuText = document.querySelector("#menu > span");

// Add listener to play button
const playButtonElement = document.getElementById("play-button");
playButtonElement.addEventListener("click", handleClickPlay);
const mouseEnterReset = () => playButtonElement.style.backgroundColor = "var(--reset-button-hover)";
const mouseLeaveReset = () => playButtonElement.style.backgroundColor = "var(--reset-button)";

resetGame();
precomputeMoveData();

// Sounds
const playSound = new Audio("./assets/play_button.wav");
const moveSound = new Audio("./assets/piece_moving.mp3");
const checkSound = new Audio("./assets/check.ogg");
const checkmateSound = new Audio("./assets/checkmate.wav");

// Initializes and runs the main game loop, and registers all the appropriate listeners
// Change the play button to the reset button:
  // Change the appearance by modifying its color and text
  // Remove the current listener
  // Add a new listener with the handleClickReset callback
// Loop through all piece divs and register piece listeners
// Loop through all squares and register square listeners
function handleClickPlay() {
  // Change button style and register reset listener
  playButtonElement.style.backgroundColor = "var(--reset-button)";
  playButtonElement.style.boxShadow = "3px 3px var(--reset-button-shadow)";
  playButtonElement.addEventListener("mouseenter", mouseEnterReset);
  playButtonElement.addEventListener("mouseleave", mouseLeaveReset);
  playButtonElement.removeEventListener("click", handleClickPlay);
  playButtonElement.addEventListener("click", handleClickReset);
  playButtonElement.innerText = "Reset";
  
  // Add listeners for window and board elements
  window.addEventListener("mousemove", handlePieceDrag);
  window.addEventListener("mouseup", handlePieceMouseUp);

  for (const piece of pieces.children) {
    piece.addEventListener("mousedown", handlePieceMouseDown);
    // piece.addEventListener("mouseup", handlePieceMouseUp);
  }

  for (const square of squares.children) {
    square.addEventListener("mousedown", handleSquareMouseDown);
  }

  menuText.innerText = "Turn White";
  playSound.play();
  moves = generateLegalMoves();
}

// Resets the game to its initial state, unregistering ALL listeners for the board
// Also changes the reset button back to being the green play button, swap the callbacks
function handleClickReset() {
  // Change style back to play and register play listener
  playButtonElement.removeEventListener("mouseenter", mouseEnterReset);
  playButtonElement.removeEventListener("mouseleave", mouseLeaveReset);
  playButtonElement.removeEventListener("click", handleClickReset);
  playButtonElement.addEventListener("click", handleClickPlay);
  playButtonElement.style.removeProperty("background-color");
  playButtonElement.style.removeProperty("box-shadow")
  playButtonElement.innerText = "Play";
  menuText.innerText = "Welcome!";
  playSound.play();
  resetGame();
}

// Handle when a piece is clicked, highlighting the square it's on and also the
// squares it can move to - probably store the selected piece in a variable
// If a piece is already selected while this fires:
  // If the clicked piece is an enemy piece:
    // If the move is legal, make it (call makeMove)
function handlePieceMouseDown(e) {
  e.preventDefault();
  const pieceElement = e.target;
  
  if (pieceElement == selectedPiece) {
    clickedSelected = true;
  }

  if (selectedPiece) {
    const squareClass = getSquareClassFromDOMElement(pieceElement);
    const index = getIndexFromSquareClass(squareClass);
    const piece = gameState.board[index];
    if (!pieceIsTurnColor(piece)) {
      const startSquareI = getIndexFromSquareClass(getSquareClassFromDOMElement(selectedPiece));
      const move = getMoveFromMoves(startSquareI, index);
      if (move) {
        makeMove(move);
        return;
      }
    }

    unSelectPiece();
  }

  selectPiece(pieceElement);
  
  selectedPiece.style.cursor = "grabbing";
  mouseDownOnPiece = true;

}

// Handles when the mouse is down and a piece is being dragged, we need to
// update the piece position in real time to follow the mouse
// We also need to keep track of which square the piece is over at any given moment,
// probably stored in a variable
function handlePieceDrag(e) {
  if (mouseDownOnPiece) {
    draggingPiece = true;

    let translateX = e.clientX - boardRect.left - (pieceDivWidth / 2);
    translateX *= 800 / boardWidth;
    translateX = translateX < -50 ? -50 : translateX;
    translateX = translateX > 750 ? 750 : translateX;

    let translateY = e.clientY - boardRect.top - (pieceDivWidth / 2);
    translateY *= 800 / boardWidth;
    translateY = translateY < -50 ? -50 : translateY;
    translateY = translateY > 750 ? 750 : translateY;

    selectedPiece.style.transform = `translate(${translateX}%, ${translateY}%)`;
    selectedPiece.style.zIndex = "2";
  }
}

function handlePieceMouseUp(e) {
  if (selectedPiece) {
    selectedPiece.style.removeProperty("cursor");
    selectedPiece.style.removeProperty("transform");
    selectedPiece.style.removeProperty("z-index");
  
    // Get the square we are on if we're in the board somewhere, otherwise null
    let squareElement = null;
    if (e.clientX < boardRect.right && e.clientX > boardRect.left && 
        e.clientY > boardRect.top && e.clientY <  boardRect.bottom) {
      squareElement = getSquareElementFromMouseCoords(e.clientX, e.clientY);
    }
  
    // If we're on a square in the board
    if (squareElement) {
      // If we clicked the already selected piece, and we're on its original square, unselect
      if (clickedSelected && getSquareClassFromDOMElement(e.target) == getSquareClassFromDOMElement(squareElement)) {
        unSelectPiece();
      }
      else {
        // check if the move is legal and make it
        const startSquareI = getIndexFromSquareClass(getSquareClassFromDOMElement(selectedPiece));
        const endSquareI = getIndexFromSquareClass(getSquareClassFromDOMElement(squareElement));
        const move = getMoveFromMoves(startSquareI, endSquareI);
        if (move) {
          makeMove(move);
        }
      }
    }
  
    draggingPiece = false;
    clickedSelected = false;
    mouseDownOnPiece = false;
  }
}

// Handles when the mouse is clicked on a square WITHOUT a piece
// It's easier to avoid dynamically registering/unregistering this only on blank square
// and instead just put it on all squares when the game starts:
  // If there is a piece on this square when the event fires, ignore this event
  // Otherwise, check if a piece is selected:
    // If not, do nothing
    // If so, check if the square we are clicking on is a legal move:
      // If so, make the move
      // If not, unselect the currently selected piece, and remove all highlights/hints
function handleSquareMouseDown(e) {
  e.preventDefault();
  if (selectedPiece) {
    const startSquareI = getIndexFromSquareClass(getSquareClassFromDOMElement(selectedPiece));
    const endSquareI = getIndexFromSquareClass(getSquareClassFromDOMElement(e.target));
    const move = getMoveFromMoves(startSquareI, endSquareI);
    if (move) {
      makeMove(move);
    }
    else {
      unSelectPiece();
    }
  }
}

// Returns: the square class from the DOM element
// Parse through the classes and find it (should always be last)
function getSquareClassFromDOMElement(element) {
  const classArr = element.className.split(" ");
  return classArr[classArr.length - 1];
}

// Return: the index of the square in the board array based on the given square class
// i.e. "square-11" -> 0
function getIndexFromSquareClass(squareClass) {
  const coords = squareClass.split("-")[1];
  const file = parseInt(coords[0]);
  const rank = parseInt(coords[1]);
  return 8 * (rank - 1) + (file - 1);
}

// Returns: the square DOM element at the given screen coordinates
// Make sure the cursor is inside the board before calling
function getSquareElementFromMouseCoords(x, y) {
  const elements = document.elementsFromPoint(x, y);
  return elements.filter(e => {
    const classArr = e.className.split(" ");
    for (const clazz of classArr) {
      if (clazz == "square-dark" || clazz == "square-light") {
        return true;
      }
    }
  })[0];
}

// Returns: the square class from an index in the board array
// i.e. index 0 -> "square-11"
function getSquareClassFromIndex(index) {
  const file = index % 8 + 1;
  const rank = Math.floor(index / 8) + 1;
  return `square-${file}${rank}`;
}

// Resets the board in the UI
// Remove all the elements and re-add the initial ones to make sure we remove all
// registered listeners
function resetGame() {
  // Clear all board and game information
  clearAllChildren(highlights);
  clearAllChildren(moveHints);
  clearAllChildren(captureHints);
  clearAllChildren(pieces);
  gameState.board.fill(NONE);
  moves = [];
  gameState.turnCol = WHITE;
  gameState.oppCol = BLACK;
  gameState.turnNum = 1;
  gameState.whiteCastlingKS = true;
  gameState.whiteCastlingQS = true;
  gameState.blackCastlingKS = true;
  gameState.blackCastlingQS = true;
  gameState.enpassantSquare = 0;
  selectedPiece = null;

  // Remove listeners
  window.removeEventListener("mousemove", handlePieceDrag);
  window.removeEventListener("mouseup", handlePieceMouseUp);
  for (const square of squares.children) {
    square.removeEventListener("mousedown", handleSquareMouseDown);
  }

  // Reset board and UI
  const startFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";

  const pieceTypes = {
    'k': KING, 'p': PAWN, 'n': KNIGHT, 'b': BISHOP, 'r': ROOK, 'q': QUEEN
  }

  let file = 0;
  let rank = 7;

  // Board
  for (const symbol of startFEN) {
    if (symbol == '/') {
      file = 0;
      rank--;
    }
    else {
      if (parseInt(symbol)) {
        file += parseInt(symbol);
      }
      else {
        // Get info about piece
        const pieceColor = (symbol == symbol.toUpperCase()) ? WHITE : BLACK;
        const pieceColorChar = (pieceColor == WHITE) ? 'w' : 'b';
        const pieceType = pieceTypes[symbol.toLowerCase()];
        const index = rank * 8 + file;

        // Add to board array
        gameState.board[index] = pieceType | pieceColor;

        // Add to UI
        const pieceDiv = document.createElement("div");
        pieceDiv.classList.add(`${pieceColorChar}${symbol.toLowerCase()}`);
        pieceDiv.classList.add(getSquareClassFromIndex(index));
        pieces.appendChild(pieceDiv);

        file++;
      }
    }
  }
}

function clearAllChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.lastChild);
  }
}

// Generates a list of all psuedo-legal moves for the current board position
// Returns: a list of all psuedo-legal moves
function generateMoves(index = null) {
  const moves = [];
  const slidingPieces = new Set([QUEEN, BISHOP, ROOK])
  const start = index == null ? 0 : index;
  const end = index == null ? 64 : index + 1;
  if (index != null) {
    swapColors();
  }

  for (let startSquare = start; startSquare < end; startSquare++) {
    const piece = gameState.board[startSquare];
    const pieceType = getPieceType(piece);
    if (pieceIsTurnColor(piece)) {
      if (slidingPieces.has(pieceType)) { // Queen, Bishop, Rook
        const startDirIndex = pieceType == BISHOP ? 4 : 0;
        const endDirIndex = pieceType == ROOK ? 4 : 8;
        for (let directionIndex = startDirIndex; directionIndex < endDirIndex; directionIndex++) {
          for (let n = 0; n < numSquaresToEdge[startSquare][directionIndex]; n++) {
            const targetSquare = startSquare + directionOffsets[directionIndex] * (n + 1);
            const pieceOnTargetSquare = gameState.board[targetSquare];

            // Blocked by one of our own pieces
            if (pieceIsTurnColor(pieceOnTargetSquare)) {
              break;
            }

            moves.push(new Move(startSquare, targetSquare));

            // Move is a capture
            if (pieceOnTargetSquare & gameState.oppCol) {
              break;
            }
          }
        }
      }
      else if (pieceType == KNIGHT) {

      }
      else if (pieceType == PAWN) {
        const pawnOffset = gameState.turnCol == WHITE ? 8 : -8; // Which direction is forward?
        const startRank = gameState.turnCol == WHITE ? 1 : 6;
        const promotionRank = gameState.turnCol == WHITE ? 7 : 0;
        const rank = Math.floor(startSquare / 8);
        const pawnAttackDirectionIndex = [[4, 6], [7, 5]]; // Index into directionOffsets
        const forwardIndex = gameState.turnCol == WHITE ? 0 : 1;
        const squareOneForward = startSquare + pawnOffset;

        // Pawn forward moves
        if (gameState.board[squareOneForward] == NONE) {
          if (rank == promotionRank - 1) { // next move is promotion
            moves.push(new Move(startSquare, squareOneForward, MOVE_FLAG_PROMOTION));
          }
          else {
            moves.push(new Move(startSquare, squareOneForward));
          }

          if (rank == startRank) { // can move 1 or 2 squares
            const squareTwoForward = squareOneForward + pawnOffset;
            if (gameState.board[squareTwoForward] == NONE) {
              moves.push(new Move(startSquare, squareTwoForward, MOVE_FLAG_PAWN_TWO));
            }
          }
        }
        
        // Pawn captures
        for (let i = 0; i < 2; i++) {
          // If a square exists to the diagonal
          if (numSquaresToEdge[startSquare][pawnAttackDirectionIndex[forwardIndex][i]] > 0) {
            const pawnCaptureDir = directionOffsets[pawnAttackDirectionIndex[forwardIndex][i]];
            const targetSquare = startSquare + pawnCaptureDir;
            const targetPiece = gameState.board[targetSquare];

            // Regular capture
            if (targetPiece && !pieceIsTurnColor(targetPiece)) {
              if (rank == promotionRank - 1) { // next move is promotion
                moves.push(new Move(startSquare, targetSquare, MOVE_FLAG_PROMOTION));
              }
              else {
                moves.push(new Move(startSquare, targetSquare));
              }
            }
            
            // En passant capture
            if (targetSquare == gameState.enpassantSquare) {
              moves.push(new Move(startSquare, targetSquare, MOVE_FLAG_ENPASSANT));
            }
          }
        }
      }
      else { // King

      }
    }
  }
  
  if (index != null) {
    swapColors();
  }

  return moves;
}

// Returns: a list of all legal moves
function generateLegalMoves() {
  const pseudoLegalMoves = generateMoves();
  
  // Filter out pins by playing all moves and seeing if opponent can take our king
  // Also filters moves that don't deal with the check, if there is one
  // Don't generate legal moves for enemy, because pinned pieces can still pin our pieces
  return pseudoLegalMoves.filter(move => {
    makeMoveBackend(move);
    const oppMoves = generateMoves();
    let legal = true;
    for (const move of oppMoves) {
      if (getPieceType(gameState.board[move.endSquare]) == KING) {
        legal = false;
        break;
      }
    }
    undoLastMoveBackend();
    return legal;
  });
}

// Returns: a list of all legal moves that originate at the given square index
// Filtered from the global moves list
function getMovesStartingAtSquare(square) {

}

// Makes the move in the board array, and calls generateMoves to update moves
// Also updates the DOM to reflect the new board state
// If this move puts the other player in check, keep track of that
// Switches the current player
function makeMove(move) {
  // Update backend
  const uiFunctionList = makeMoveBackend(move);
  
  // Update UI
  for (const func of uiFunctionList) {
    func();
  }

  // Generate new moves lists
  moves = generateLegalMoves();
  
  if (moves.length == 0) {
    // Checkmate
  }
  else {
    const movedPieceMoves = generateMoves(move.endSquare);
    let check = false;
    for (const move of movedPieceMoves) {
      if (getPieceType(gameState.board[move.endSquare]) == KING) {
        check = true;
        break;
      }
    }
    if (check) {
      checkSound.play();
      menuText.innerText = `Check. Turn ${gameState.turnCol == WHITE ? "White" : "Black"}.`;
    }
    else {
      moveSound.play();
      menuText.innerText = `Turn ${gameState.turnCol == WHITE ? "White" : "Black"}.`;
    }
  }

}

function makeMoveBackend(move) {
  // Save old gamestate
  prevGameState = structuredClone(gameState);

  const uiFunctionList = [];

  const { startSquare, endSquare, flag } = move;

  // Get info about pieces involved
  const movePiece = gameState.board[startSquare];
  const capturedPiece = gameState.board[endSquare];

  // Handle captures
  if (capturedPiece) {
    uiFunctionList.push(() => removePieceFromUI(endSquare));
    uiFunctionList.push(() => addCapturedPiece(capturedPiece));
  }


  // Handle castling - set global flags

  // Handle en-passant
  if (flag == MOVE_FLAG_ENPASSANT) {
    const enPassantOffset = gameState.turnCol == WHITE ? -8 : 8;
    const capturedPieceSquare = gameState.enpassantSquare + enPassantOffset;
    const capturedPiece = gameState.board[capturedPieceSquare];
    uiFunctionList.push(() => removePieceFromUI(capturedPieceSquare));
    uiFunctionList.push(() => addCapturedPiece(capturedPiece))
    gameState.board[capturedPieceSquare] = NONE;
  }

  // Check if pawn moved two forward - if so, set en passant flag - otherwise reset it
  if (flag == MOVE_FLAG_PAWN_TWO) {
    const enPassantOffset = gameState.turnCol == WHITE ? -8 : 8;
    gameState.enpassantSquare = endSquare + enPassantOffset;
  }
  else {
    gameState.enpassantSquare = 0;
  }


  // Move pieces in board array - also check promotion
  if (flag == MOVE_FLAG_PROMOTION) {
    gameState.board[endSquare] = gameState.turnCol | QUEEN;
    const color = gameState.turnCol; // get turnCol by value
    uiFunctionList.push(() => promotePieceTypeToQueen(startSquare, color));
  }
  else {
    gameState.board[endSquare] = movePiece;
  }
  gameState.board[startSquare] = NONE;

  // Update game state
  swapColors();
  gameState.turnNum++;

  uiFunctionList.push(() => updatePieceSquareClass(startSquare, endSquare));
  uiFunctionList.push(() => unSelectPiece());

  return uiFunctionList;
}

function undoLastMoveBackend() {
  gameState = prevGameState;
}

function swapColors() {
  const tempCol = gameState.turnCol;
  gameState.turnCol = gameState.oppCol;
  gameState.oppCol = tempCol;
}

function highlightSquare(squareClass) {
  const highlightDiv = document.createElement("div");
  highlightDiv.classList.add(squareClass);
  highlights.appendChild(highlightDiv);
}

function createMoveHint(squareClass) {
  const moveHintDiv = document.createElement("div");
  moveHintDiv.classList.add(squareClass);
  moveHints.appendChild(moveHintDiv);
}

function createCaptureHint(squareClass) {
  const captureHintDiv = document.createElement("div");
  captureHintDiv.classList.add(squareClass);
  captureHints.appendChild(captureHintDiv);
}

// Adds the tiny picture of a captured piece on the appropriate player's side of the UI
function addCapturedPiece(piece) {

}

function getPieceClassFromPiece(piece) {
  const pieceChars = {
    // [KING]: 'k', [PAWN]: 
  }
}

function selectPiece(piece) {
  selectedPiece = piece;
  const squareClass = getSquareClassFromDOMElement(piece);
  const index = getIndexFromSquareClass(squareClass);

  highlightSquare(squareClass);
  
  // Move hints
  for (const move of moves) {
    if (move.startSquare == index) {
      const hintSquareClass = getSquareClassFromIndex(move.endSquare);
      if (gameState.board[move.endSquare]) {
        createCaptureHint(hintSquareClass);
      }
      else {
        createMoveHint(hintSquareClass);
      }
    }
  }
}

// Unselect the currently selected piece
function unSelectPiece() {
  selectedPiece = null;
  clearAllChildren(highlights);
  clearAllChildren(moveHints);
  clearAllChildren(captureHints);
}

// Fills the numSqauresToEdge array with data
function precomputeMoveData() {
  for (let rank = 0; rank < 8; rank++) {
    for (let file = 0; file < 8; file++) {
      const numNorth = 7 - rank;
      const numSouth = rank;
      const numWest = file;
      const numEast = 7 - file;

      const index = rank * 8 + file;

      numSquaresToEdge[index] = [
        numNorth, numSouth, numWest, numEast, // orthogonal
        Math.min(numNorth, numWest), // NW
        Math.min(numSouth, numEast), // SE
        Math.min(numNorth, numEast), // NE
        Math.min(numSouth, numWest)  // SW
      ];
    }
  }
}

function pieceIsTurnColor(piece) {
  return piece & gameState.turnCol;
}

function getPieceType(piece) {
  return piece & TYPE_MASK;
}

function getPieceColor(piece) {
  return piece & COLOR_MASK;
}

// Changes the squareClass of the piece currently at oldSquare in the UI to newSquare
function updatePieceSquareClass(oldSquare, newSquare) {
  const oldSquareClass = getSquareClassFromIndex(oldSquare);
  const newSquareClass = getSquareClassFromIndex(newSquare);
  const pieceDiv = pieces.querySelector(`.${oldSquareClass}`);
  pieceDiv.classList.replace(oldSquareClass, newSquareClass);
}

function promotePieceTypeToQueen(squareIndex, color) {
  const squareClass = getSquareClassFromIndex(squareIndex);
  const pieceDiv = pieces.querySelector(`.${squareClass}`);
  const colorChar = color == WHITE ? 'w' : 'b';
  const newPieceClass = colorChar + 'q';
  const oldPieceClass = pieceDiv.className.split(" ")[0];
  pieceDiv.classList.replace(oldPieceClass, newPieceClass);
}

// For captures
function removePieceFromUI(index) {
  const squareClass = getSquareClassFromIndex(index);
  const pieceDiv = pieces.querySelector(`.${squareClass}`);
  pieces.removeChild(pieceDiv);
}

function getMoveFromMoves(startSquare, endSquare) {
  for (const move of moves) {
    if (move.startSquare == startSquare && move.endSquare == endSquare) {
      return move;
    }
  }
  return null;
}