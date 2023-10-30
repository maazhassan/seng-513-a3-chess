/* Course: SENG 513 */
/* Date: OCT 23, 2023 */
/* Assignment 2 */
/* Name: Maaz Hassan */
/* UCID: 30087059 */

// Array to represent the boardstate, 1D is probably fine
// Order: bottom-left to top-right
const board = new Array(64);

// Need to create some sort of encoding to represent pieces in the array
// Something like:
// const NONE  = 0
// const KING = 1
// const PAWN = 2
// ...
// we can use binary modifiers 8 and 16 for black/white, since we have 7 values otherwise
// so we can do things like board[0] = BLACK | ROOK
// color can be checked by & ex. if (board[0] & WHITE)

const NONE = 0;
const KING = 1;
const PAWN = 2;
const KNIGHT = 3;
const BISHOP = 4;
const ROOK  = 5;
const QUEEN = 6;
const WHITE = 8;
const BLACK = 16;


// Move object for storing move data - start and end square indices
function Move(startSquare, endSquare) {
  this.startSquare = startSquare;
  this.endSquare = endSquare;
}

// Array that stores all the valid moves for the current position
// Updated by generateMoves function
// Used by getMovesStartingAtSqaure
let moves = []

// Stores who's turn it currently is, probably initialized to either WHITE or BLACK (8/16)
let turnCol = WHITE;
let turnNum = 1;

// Castling availability
let whiteCastlingKS = true;
let whiteCastlingQS = true;
let blackCastlingKS = true;
let blackCastlingQS = true;

// En passant square - [index, turnNum]
let enpassantSquare = [-1, 0];

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

// Add listener to play button
const playButtonElement = document.getElementById("play-button");
playButtonElement.addEventListener("click", handleClickPlay);
const mouseEnterReset = () => playButtonElement.style.backgroundColor = "var(--reset-button-hover)";
const mouseLeaveReset = () => playButtonElement.style.backgroundColor = "var(--reset-button)";

resetGame();

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
  resetGame();
}

// Handle when a piece is clicked, highlighting the square it's on and also the
// squares it can move to - probably store the selected piece in a variable
// If a piece is already selected while this fires:
  // If the clicked piece is an enemy piece:
    // If the move is legal, make it (call makeMove)
// We also need to check if the piece is being dragged:
  // Attach a "mousemove" event listener to this piece while the mouse is down
function handlePieceMouseDown(e) {
  e.preventDefault();
  const pieceElement = e.target;
  
  if (pieceElement == selectedPiece) {
    clickedSelected = true;
  }

  if (selectedPiece) {
    unSelectPiece();
  }

  // Select piece
  selectedPiece = pieceElement;
  selectedPiece.style.cursor = "grabbing";
  mouseDownOnPiece = true;

  // Add highlight
  highlightSquare(getSquareClassFromDOMElement(selectedPiece));
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
  selectedPiece?.style.removeProperty("cursor");
  selectedPiece?.style.removeProperty("transform");
  selectedPiece?.style.removeProperty("z-index");

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
      //TODO: unselect function call
      unSelectPiece();
    }
    else {
      // check if the move is legal and make it
    }
  }

  draggingPiece = false;
  clickedSelected = false;
  mouseDownOnPiece = false;
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
  console.log(e.target);
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
  
}

// Returns: the index of the square in the board array at the given
// screen coordinates - used for dragging
function getIndexFromMouseCoords(x, y) {

}

// Returns: the square DOM element at the given screen coordinates
// Make sure the cursor is inside the board before calling
function getSquareElementFromMouseCoords(x, y) {
  const elements = document.elementsFromPoint(x, y);
  return elements.filter(e => {
    const classArr = e.className.split(" ");
    for (const clazz of classArr) {
      if (clazz == "square-dark" || clazz == "square-light") {
        return e;
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
  // Clear all board and UI information
  clearAllChildren(highlights);
  clearAllChildren(pieces);
  clearAllChildren(moveHints);
  clearAllChildren(captureHints);
  board.fill(NONE);
  whiteCastlingKS = true;
  whiteCastlingQS = true;
  blackCastlingKS = true;
  blackCastlingQS = true;
  turnCol = WHITE;
  turnNum = 1;
  enpassantSquare = [-1, 0];
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
        const pieceColorChar = (pieceColor == WHITE) ? "w" : "b";
        const pieceType = pieceTypes[symbol.toLowerCase()];
        const index = rank * 8 + file;

        // Add to board array
        board[index] = pieceType | pieceColor;

        // Add to pieces div for UI
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

// Generates a list of all legal moves for the current board position
// Does not return this list; instead it sets the global "moves" array to it
// On average, a given position has 15-40 legal moves
function generateMoves() {

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

}

// Following 2 functions used for (un)highlighting squares when they are selected
function highlightSquare(squareClass) {
  const highlightDiv = document.createElement("div");
  highlightDiv.classList.add(squareClass);
  highlights.appendChild(highlightDiv);
}

function unHighlightSquare(squareClass) {
  const highlightDiv = highlights.querySelector(`.${squareClass}`);
  highlights.removeChild(highlightDiv);
}

// Following 4 functions used for creating and removing hints when pieces are (un)selected
function createMoveHint(squareClass) {

}

function removeMoveHint(squareClass) {

}

function createCaptureHint(squareClass) {

}

function removeCaptureHint(squareClass) {

}

// Adds the tiny picture of a captured piece on the appropriate player's side of the UI
function addCapturedPiece(piece) {

}

// Unselect the currently selected piece
function unSelectPiece() {
  unHighlightSquare(getSquareClassFromDOMElement(selectedPiece));
  selectedPiece = null;
  // TODO: remove all hints on the board
}