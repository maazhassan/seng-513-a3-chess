# Maaz Hassan - SENG 513 Assignment 2 - Chess

## Target Platform: Desktop

## Game Genre: Puzzle, Board

## Objective

Checkmate the opponent without getting checkmated yourself.

## Rules of the Game

See [here](https://en.wikipedia.org/wiki/Rules_of_chess) for a comprehensive list of rules. There are many rules, some of which will be explained below:

- Check: attacking the opponent's king
- Checkmate: putting the opponent in a check they cannot escape (the king will die no matter what move the opponent makes)
- Pawns can:
    - Move 1 or 2 squares forward on their first move
    - Only capture one square diagonally (but there is also [en passant](https://en.wikipedia.org/wiki/En_passant))
    - Move 1 square forward otherwise
- Knights can:
    - Only move and capture one square diagonally and 2 squares straight (in any direction)
- Bishops can:
    - Only move and capture diagonally (any amount of squares)
- Rooks can:
    - Only move and capture straight (horizontally or vertically, any amount of squares)
- Queens can:
    - Move and capture like bishops and rooks (one at a time though, either straight or diagonally)
- Kings can:
    - Only move and capture one square away, in any direction
- If your rook and king (on either side) have not moved, and there are no pieces between them, you can [castle](https://en.wikipedia.org/wiki/Castling)
- Pawns that reach the last rank can promote to either a knight, bishop, rook, or queen
- If either player is put into a position where they cannot move, yet their king is not in check, the game ends in stalemate (a draw)
- There are various other draw conditions, see [here](https://en.wikipedia.org/wiki/Draw_(chess))

## Game Mechanics

- Moving pieces by either clicking the start and end squares, or drag/dropping
- Move hints for selected pieces that show all available legal moves
- All piece logic and game mechanics integrated, as well as check/checkmate
- Play button starts game, turns into reset button while game is running which will stop the game and reset the position
