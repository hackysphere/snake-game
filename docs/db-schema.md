# firebase rtdb storage schema

## json db
* root: object
    * grid: array 
      holds the current status of the grid
        * [0] - [4]: str (grid_row)  
          holds the state of a row
    * last_dir: int (dir)  
      holds the last direction of movement
    * last_ts: int  
      holds the timestamp of the previous move
    * move: int  
      holds the current move number of the "round"  
      not required for game logic
    * next_ts: int  
      holds the timestamp of when the next move should be played  
      not required for proper game logic
    * snake_pos: array 
      holds the positions of snake body
      * \[*]: array  
        holds the position of a snake part in `[x, y]`
    * start_ts: int  
      holds the timestamp of the start of the round  
      not required for game logic
    * votes: object
        * [0] - [2]: int  
          holds the current number of votes for the corresponding direction choice (deterministic)

## "types"
### grid_row
string of int, can be:
* 0: empty square
* 1: wall
* 2: apple
* 3: snake

### last_dir
int, can be:
* 0: right / east
* 1: down  / south
* 2: left  / west
* 3: up    / north