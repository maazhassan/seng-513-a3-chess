/* Course: SENG 513 */
/* Date: OCT 23, 2023 */
/* Assignment 2 */
/* Name: Maaz Hassan */
/* UCID: 30087059 */

// Array to represent the boardstate, 1D is probably fine
// Order: bottom-left to top-right
const board = []

// Need to create some sort of encoding to represent pieces in the array
// Something like:
// const NONE  = 0
// const KING = 1
// const PAWN = 2
// ...
// we can use binary modifiers 8 and 16 for black/white, since we have 7 values otherwise
// so we can do things like board[0] = BLACK | ROOK
// color can be checked by & ex. if (board[0] & WHITE)


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
let turn;

// Store the currently selected piece
let selectedPiece = null;

// Are we currently dragging a piece
let mouseDown = false;
let draggingPiece = false;

// Get coordinates of board for drag offset correction
const boardElement = document.getElementById("board");
const boardRect = boardElement.getBoundingClientRect();
const boardWidth = boardRect.right - boardRect.left;

// Get piece div width for drag offset correction
const pieceDivWidth = boardWidth / 8;

// Add listener to play button
const playButtonElement = document.getElementById("play-button");
playButtonElement.addEventListener("click", handleClickPlay);

// Initializes and runs the main game loop, and registers all the appropriate listeners
// Change the play button to the reset button:
  // Change the appearance by modifying its color and text
  // Remove the current listener
  // Add a new listener with the handleClickReset callback
// Loop through all piece divs and register piece listeners
// Loop through all squares and register square listeners
function handleClickPlay() {
  console.log("Play clicked");
  window.addEventListener("mousemove", handlePieceDrag);
  window.addEventListener("mouseup", handlePieceDragMouseUp);
  // windows.addEventListener("mouseup", e => {
  //   mouseDown = false;
  // })

  const pieces = document.getElementById("pieces").children;
  for (const piece of pieces) {
    piece.addEventListener("mousedown", handlePieceMouseDown);
    piece.addEventListener("mouseup", handlePieceMouseUp);
  }

  const squares = document.getElementById("squares").children;
  for (const square of squares) {
    square.addEventListener("mousedown", handleSquareMouseDown);
  }
}

// Resets the game to its initial state, unregistering ALL listeners for the board
// Also changes the reset button back to being the green play button, swap the callbacks
function handleClickReset() {

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
  selectedPiece = pieceElement;
  selectedPiece.style.cursor = "grabbing";
  mouseDown = true;
}

// If the the piece this is called for is already selected, unselect it, unhighlight
// the square, and remove all hints
// If we were dragging, check which square we ended up on and handle appropriately:
  // If the move is legal, make it
  // If we are on the original square, unselect the piece
  // Otherwise, snap the piece back to the original spot (keep it selected unless original square)
function handlePieceMouseUp(e) {
  // const pieceElement = e.target;
  // pieceElement.style.removeProperty("cursor");

  // if (draggingPiece) {
  //   draggingPiece = false;
    
  //   pieceElement.style.removeProperty("transform");
  //   pieceElement.style.removeProperty("z-index");
  // }

  // mouseDown = false;
}

// Handles when the mouse is down and a piece is being dragged, we need to
// update the piece position in real time to follow the mouse
// We also need to keep track of which square the piece is over at any given moment,
// probably stored in a variable
function handlePieceDrag(e) {
  if (mouseDown) {
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

function handlePieceDragMouseUp(e) {
  selectedPiece.style.removeProperty("cursor");

  if (draggingPiece) {
    draggingPiece = false;
    
    selectedPiece.style.removeProperty("transform");
    selectedPiece.style.removeProperty("z-index");
  }

  mouseDown = false;
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
  return element.className.split(" ")[1];
}

// Return: the index of the square in the board array based on the given square class
// i.e. "square-11" -> 0
function getIndexFromSquareClass(squareClass) {
  
}

// Returns: the index of the square in the board array at the given
// screen coordinates - used for dragging
function getIndexFromMouseCoords(x, y) {

}

// Returns: the square class from an index in the board array
// i.e. index 0 -> "square-11"
function getSquareClassFromIndex(index) {

}

// Resets the board in the UI
// Remove all the elements and re-add the initial ones to make sure we remove all
// registered listeners
function resetGame() {

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

}

function unHighlightSquare(squareClass) {

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
