# Explantion

## Code Block 1

```js
// Returns: a list of all legal moves
// Custom Interaction Mechanism
function generateLegalMoves() {
  const pseudoLegalMoves = generateMoves();
  
  // Filter out pins by playing all moves and seeing if opponent can take our king
  // Also filters moves that don't deal with the check, if there is one
  // Also filters out castling moves if the move castles through/into a check
  // Don't generate legal moves for enemy, because pinned pieces can still pin our pieces
  return pseudoLegalMoves.filter(move => {
    const isCastling = move.flag == MOVE_FLAG_CASTLING;
    const ogEndSquare = move.endSquare;
    makeMoveBackend(move);
    const oppMoves = generateMoves();
    let legal = true;
    for (const move of oppMoves) {
      if (getPieceType(gameState.board[move.endSquare]) == KING) {
        legal = false;
        break;
      }
      if (isCastling) {
        if (ogEndSquare == 6 || ogEndSquare == 62) {
          if (move.endSquare == ogEndSquare - 1) {
            legal = false;
            break;
          }
        }
        else if (ogEndSquare == 2 || ogEndSquare == 58) {
          if (move.endSquare == ogEndSquare + 1) {
            legal = false;
            break;
          }
        }
      }
    }
    undoLastMoveBackend();
    return legal;
  });
}
```

The above function is used to filter out the illegal moves from a list of psuedo-legal chess moves. A pseudo-legal move in chess is a move that follows all the rules of how pieces move, but does not take into account whether your king is in check or if a piece is pinned. Moves that leave the king in check are illegal, even if they follow all the rules otherwise. To fix this, the above code first plays the move in the back-end only (the UI does not reflect this at all), and then generates a list of all the opponents moves. It then loops through those moves and sees if any of them are attacking our king. If so, the original move is removed from the list of legal moves. The move is then undone in the backend.

## Code Block 2

```js
else if (pieceType == KNIGHT) {
  for (const knightJumpOffset of knightJumps) {
    const targetSquare = startSquare + knightJumpOffset;
    if (targetSquare >= 0 && targetSquare < 64) {
      const targetSquareRank = Math.floor(targetSquare / 8);
      const targetSquareFile = targetSquare % 8;
      const rankDelta = Math.abs(rank - targetSquareRank);
      const fileDelta = Math.abs(file - targetSquareFile);
      const maxDelta = Math.max(rankDelta, fileDelta);
      if (maxDelta == 2) {
        const pieceOnTargetSquare = gameState.board[targetSquare];
        if (!pieceIsTurnColor(pieceOnTargetSquare)) {
          moves.push(new Move(startSquare, targetSquare));
        }
      }
    }
  }
}
```

The above code is part of the `generateMoves()` function, and is responsible for generating the moves for a knight. `knightJumps` is the constant array `[15, 17, -17, -15, 10, -6, 6, -10]`, which contains index offsets for all the possible squares a knight *could* move to, assuming that square is on the board and an allied piece is not on it. For example, if we take any square and add 15 to its index in our board array, the resulting square is a square that a knight could jump to (it will be the square 2 up and 1 left). A caveat with this method is that we can potentially include squares that wrap around the board, which a knight should not be able to jump to. To exclude these, we calculate the absolute delta (distance) from the start square to the target square, and make sure this delta is 2. Then, only if the delta is 2, and the target square does not have an allied piece on it, we push the move to our moves array.

## Code Block 3

```js
// Handles when the mouse is down and a piece is being dragged, we need to
// update the piece position in real time to follow the mouse
// Custom Animation
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
```

The above function is a callback function attached to the `window` that is called whenever the mouse is moved. First we check it see if the mouse is down on a piece, because that is when we are dragging. We now need to calculate the new position of the piece in the board based on the mouse coordinates. The line `let translateX = e.clientX - boardRect.left - (pieceDivWidth / 2);` figures out the offset of the mouse from the left edge of the board, and also accounts for the piece width so that when we are dragging, we drag from the middle of the piece. The next line `translateX *= 800 / boardWidth;` converts this pixel offset into a CSS translation percentage between 0 and 700, based on the previously calculated offset and the width of the board. This translation percentage follows the system defined in the CSS for placing div elements on the board. The next two lines bound the translation percent to be contained within the board, so that even if the mouse leaves the board, the piece does not. The exact same logic as before is applied for the Y coordinates as well. We then apply the translation to the dragged piece by updating its CSS style, which moves the piece in the UI. The Z-Index is also updated to make sure the dragged piece is above everything else on the board.