import * as CONST from "./constants.js";

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

/**
 * Get the new direction after changing the last direction (optionally with offset)
 * @param {number} lastDir Last direction of movement
 * @param {number} change Change from previous direction
 * @param {number?} offset Optional offset to use as base direction (or else -1)
 * @returns new direction
 */
export function getDirWithOffset(lastDir, change, offset = -1) {
  let noBoundDir = lastDir + offset + change + 4;
  let boundedDir = noBoundDir % 4;
  return boundedDir;
}

// NOTE: height cannot be more than 5 because there is not enough HTML elements in the frontend
export function newMove(state, height = 5, width = 5) {
  try {
    // set up local db copy and base of new game state
    const tmpState = structuredClone(state);
    let newState = {
      game_id: tmpState.game_id,

      apple_pos: tmpState.apple_pos,
      last_ts: Date.now(),
      move: tmpState.move + 1,
      next_ts: Date.now() + CONST.MOVEDELAY,
      snake_pos: tmpState.snake_pos,
      start_ts: tmpState.start_ts,
      votes: [0, 0, 0],
    };

    // reset game if this was the "game win" "move"
    if (tmpState.grid[0][0] === "✅") {
      throw new Error("Game_WallHit");
    }
    if (tmpState.votes.every((x) => x === 0)) {
      throw new Error("Game_NoVotes");
    }

    let voteIndex = 0;
    for (let i = 1; i < 3; i++) {
      if (tmpState.votes[i] > tmpState.votes[voteIndex]) {
        voteIndex = i;
      }
    }

    // set "default" to middle option (which is the same path)
    if (tmpState.votes.filter((val) => val !== tmpState.votes[voteIndex]).length !== 2) {
      voteIndex = 1;
    }
    let newDir = getDirWithOffset(tmpState.last_dir, voteIndex);
    newState.last_dir = newDir;

    let newHeadPos = structuredClone(tmpState.snake_pos[0]); // javascript annoyance :(  (will change object state if not used)
    switch (newDir) {
      case 0:
        newHeadPos[1]++;
        break;
      case 1:
        newHeadPos[0]++;
        break;
      case 2:
        newHeadPos[1]--;
        break;
      case 3:
        newHeadPos[0]--;
        break;
      default:
        showError("Could not update board to new move!");
        return;
    }
    if (newHeadPos[0] < 0 || newHeadPos[0] >= state.grid.length) {
      throw new Error("Game_WallHit");
    }
    if (newHeadPos[1] < 0 || newHeadPos[1] >= state.grid[0].length) {
      throw new Error("Game_WallHit");
    }
    const currentTile = state.grid[newHeadPos[0]][newHeadPos[1]];

    let widthElement = "0".repeat(width);
    let grid = Array(height).fill(widthElement);

    if (tmpState.snake_pos.length === 24 && currentTile === "2") {
      throw new Error("Game_GameWon");
    }

    if (currentTile === "1") {
      throw new Error("Game_WallHit");
      // this actually doesn't work as of 68a7c415, as the state doesn't have the wall tile yet...
      // keeping this in for easier future integration (or other "features")
    } else if (currentTile == "2") {
      // apple
      let validApplePos = true;
      do {
        validApplePos = true;
        const appleLoc = [randomInt(0, state.grid.length), randomInt(0, state.grid[0].length)];

        for (let i = 0; i < newState.snake_pos.length; i++) {
          if (
            newState.snake_pos[i][0] === appleLoc[0] &&
            newState.snake_pos[i][1] === appleLoc[1]
          ) {
            validApplePos = false;
            break;
          }
        }
        if (appleLoc[0] === newHeadPos[0] && appleLoc[1] === newHeadPos[1]) {
          validApplePos = false;
        }

        newState.apple_pos = appleLoc;
      } while (!validApplePos);
    } else {
      newState.snake_pos = newState.snake_pos.slice(0, -1);
    }
    // put snake WITHOUT head on grid (because of upcoming collision check)
    for (let i = 0; i < newState.snake_pos.length; i++) {
      grid[newState.snake_pos[i][0]] = stringCharReplace(
        grid[newState.snake_pos[i][0]],
        "3",
        newState.snake_pos[i][1],
      );
    }
    // put apple on grid
    grid[newState.apple_pos[0]] = stringCharReplace(
      grid[newState.apple_pos[0]],
      "2",
      newState.apple_pos[1],
    );

    if (grid[newHeadPos[0]][newHeadPos[1]] == "3") {
      throw new Error("Game_WallHit");
    }

    // NOW set head
    // this is here otherwise the hit self check will always be hitting the head!
    newState.snake_pos.unshift(newHeadPos);
    grid[newHeadPos[0]] = stringCharReplace(grid[newHeadPos[0]], "3", newHeadPos[1]);

    newState.grid = grid;
    return newState;
  } catch (err) {
    if (err.message === "Game_WallHit") {
      return CONST.DEFAULTSTATE();
    } else if (err.message === "Game_NoVotes") {
      let tmpState = structuredClone(state);
      tmpState.last_ts = Date.now();
      tmpState.next_ts = Date.now() + CONST.MOVEDELAY;
      tmpState.votes = [0, 0, 0];

      return tmpState;
    } else if (err.message == "Game_GameWon") {
      let tmpState = CONST.DEFAULTSTATE();
      tmpState.grid = ["✅✅✅✅✅", "11111", "13331", "11111", "✅✅✅✅✅"];
      tmpState.apple_pos = [-1, -1];
      tmpState.snake_pos = [
        [2, 3],
        [2, 2],
        [2, 1],
      ];
      tmpState.move = state.move + 1;

      return tmpState;
    } else {
      console.error(err);
    }
  }
}
