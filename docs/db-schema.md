# firebase rtdb storage schema

## json db
* root: object
    * grid: array 
      holds the current status of the grid
        * [0] - [4]: str (grid_row)  
          holds the state of a row
    * last_dir: int (dir)  
      holds the last direction of movement
    * move: int  
      holds the current move of the "round"
    * next_ts: int  
      holds the unix timestamp of when the next move should be played
    * snake_pos: array 
      holds the positions of snake body
      * \[*]: str  
        holds the position of a snake part in `x,y`
    * start_ts: int  
      holds the time of the start of the round as a unix timestamp
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