import * as CONST from "./constants.js"

/**
 * Replaces `char` at `location` in string `original`
 * @param {string} original
 * @param {string} char
 * @param {number} location
 */
export function stringCharReplace(original, char, location) {
  let content = Array.from(original);
  content[location] = char;
  return content.join("");
}

/**
 * Get a random integer in range of min, max
 * 
 * NOTE: max is NOT inclusive!!!
 */
export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

// FIXME: this is very very messy
export function newMove(state) {
  try {
    // set up local db copy and base of new game state
    const tmpState = structuredClone(state);
    let newState = {
      "game_id": tmpState.game_id,

      "apple_pos": tmpState.apple_pos,
      "last_ts": Date.now(),
      "move": tmpState.move + 1,
      "next_ts": Date.now() + CONST.MOVEDELAY,
      "snake_pos": tmpState.snake_pos,
      "start_ts": tmpState.start_ts,
      "votes": [0, 0, 0]
    }

    // reset game if this was the "game win" "move"
    if (tmpState.grid[0][0] == "✅") {
      throw new Error("Game_WallHit");
    }

    // winning vote and position calculation
    let voteIndex = 0;
    for (let i = 1; i < 3; i++) {
      if (tmpState.votes[i] > tmpState.votes[voteIndex]) {
        voteIndex = i;
      }
    }
    // set "default" to middle option/same path
    if ( tmpState.votes.filter(val => val !== tmpState.votes[voteIndex]).length !== 2 ) {
      voteIndex = 1;
    }
    if (tmpState.votes.every(x => x == 0)) {
      throw new Error("Game_NoVotes");
    }
    let dir = (tmpState.last_dir - 1 + voteIndex) % 4;
    while (dir < 0) { dir = 4 + dir; }
    newState.last_dir = dir;

    // setting new snake HEAD position to be checked and storing position's tile
    let pos = structuredClone(tmpState.snake_pos[0]);  // javascript annoyance :(  (will change object state)
    switch (dir) {
      case 0:
        pos[1]++;
        break;
      case 1:
        pos[0]++;
        break;
      case 2:
        pos[1]--;
        break;
      case 3:
        pos[0]--;
        break;
      default:
        showError("Could not update board to new move!");
        return;
    }
    // OOB collision check (otherwise setting tile breaks)
    if (pos[0] < 0 || pos[0] >= state.grid.length) {
      throw new Error("Game_WallHit");
    }
    if (pos[1] < 0 || pos[1] >= state.grid[0].length) {
      throw new Error("Game_WallHit");
    }
    const currentTile = state.grid[pos[0]][pos[1]];

    

    // make new grid
    // FIXME: this grid is hardcoded
    let grid = [
      "00000",
      "00000",
      "00000",
      "00000",
      "00000"
    ]

    // check if game has been won
    // length check is 1 less than total grid area
    if (tmpState.snake_pos.length == 24 && currentTile == "2") {
      throw new Error("Game_GameWon");
    }

    // wall check, setting apple (if needed), removing tail (if needed)
    if (currentTile == "1") { // wall
      throw new Error("Game_WallHit");
      // TODO this actually doesn't work because the grid gets generated from a clean slate,
      // and the db has no information on where walls are...
    } else if (currentTile == "2") { // apple
      let validPos = true;
      do {
        validPos = true;
        const newPlacement = [randomInt(0, state.grid.length), randomInt(0, state.grid[0].length)];

        // check if overlapping with body
        for (let i = 0; i < newState.snake_pos.length; i++) {
          if (newState.snake_pos[i][0] === newPlacement[0] && newState.snake_pos[i][1] === newPlacement[1]) {
            validPos = false;
            break;
          }
        }
        // also check if overlapping with head
        if (newPlacement[0] === pos[0] && newPlacement[1] === pos[1]) {
          validPos = false;
        }

        newState.apple_pos = newPlacement;
      } while (!validPos);
    } else {
      newState.snake_pos = newState.snake_pos.slice(0, -1);
    }
    // put snake without head on grid
    for (let i = 0; i < newState.snake_pos.length; i++) {
      grid[newState.snake_pos[i][0]] = stringCharReplace(grid[newState.snake_pos[i][0]], "3", newState.snake_pos[i][1]);
    }
    
    // put apple on grid
    grid[newState.apple_pos[0]] = stringCharReplace(grid[newState.apple_pos[0]], "2", newState.apple_pos[1]);

    // check if hitting self from NEW state
    if (grid[pos[0]][pos[1]] == "3") {
      throw new Error("Game_WallHit");
    }

    // NOW set head
    // this is here otherwise the hit self check will always be hitting the head!
    newState.snake_pos.unshift(pos);
    grid[pos[0]] = stringCharReplace(grid[pos[0]], "3", pos[1]);

    
    // save the grid
    newState.grid = grid;
    return newState;
  } catch (err) {
    if (err.message === "Game_WallHit") {
      return CONST.DEFAULTSTATE()
    } else if (err.message === "Game_NoVotes") {
      let tmpState = structuredClone(state);
      tmpState.last_ts = Date.now();
      tmpState.move += 1;
      tmpState.next_ts = Date.now() + CONST.MOVEDELAY;
      tmpState.votes = [0, 0, 0];

      return tmpState;
    } else if (err.message == "Game_GameWon") {
      let tmpState = CONST.DEFAULTSTATE();
      tmpState.grid = [
        "✅✅✅✅✅",
        "11111",
        "13331",
        "11111",
        "✅✅✅✅✅"
      ];
      tmpState.apple_pos = [-1, -1];
      tmpState.snake_pos = [[2, 3], [2, 2], [2, 1]];
      tmpState.move = state.move + 1;
      
      return tmpState;
      // setTimeout(() => showError("the game has been won!!!"), 1000); // TODO migrate this to the client code
    } else {
      console.error(err);
    }
  }
}