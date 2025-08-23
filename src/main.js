// TODO: convert to typescript or something for better type *hinting* (not really checking)
// NOTE TO SELF: grid length and width is hardcoded in newMove grid variable
// game also breaks if snake is at size 24 or 25...
// also this file is just a big clump of things *_*

import * as CONST from "./constants.js";
const $ = (id) => {return document.getElementById(id)};

// these will always be disabled in production due to vite build states
const DEVMODE = import.meta.env.DEV && !false
const MULTIVOTE = import.meta.env.DEV && false
if (import.meta.env.DEV) {
  $("dev-build").removeAttribute("hidden");
  if (DEVMODE) { $("dev-build-data").innerHTML += "DEVMODE "; }
  if (MULTIVOTE) { $("dev-build-data").innerHTML += "MULTIVOTE "; }
}

import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, get, update, increment } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_firebase_apiKey,
  authDomain: import.meta.env.VITE_firebase_authDomain,
  projectId: import.meta.env.VITE_firebase_projectId,
  storageBucket: import.meta.env.VITE_firebase_storageBucket,
  messagingSenderId: import.meta.env.VITE_firebase_messagingSenderId,
  appId: import.meta.env.VITE_firebase_appId,
  databaseURL: import.meta.env.VITE_firebase_databaseURL,
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);



const MOVEDELAY = (() => {
  // milliseconds due to Date.now()
  if (!DEVMODE) { return CONST.MOVEDELAY; }
  else { return CONST.MOVEDELAY_DEV;}
})();
let lastVoteTs = localStorage.getItem("vote_lastTs") ?? 0;
let lastVoteChoice = localStorage.getItem("vote_lastChoice") ?? null;
let dbState;
let errTrip = false;


/**
 * Replaces `char` at `location` in string `original`
 * @param {string} original
 * @param {string} char
 * @param {number} location
 */
function stringCharReplace(original, char, location) {
  let content = Array.from(original);
  content[location] = char;
  return content.join("");
}

/**
 * Get a random integer in range of min, max
 * 
 * NOTE: max is NOT inclusive!!!
 */
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min) + min);
}

function showError(message) {
  errTrip = true;
  message ? message : "An undefined error has occured.";
  $("error-message").removeAttribute("hidden");
  $("error-message").innerHTML = message;
  console.error(message);
}

/**
 * Updates/sets the stored values for current vote status in browser storage
 */
function updateStorage() {
  localStorage.setItem("vote_lastTs", lastVoteTs);
  localStorage.setItem("vote_lastChoice", lastVoteChoice);
}

function updateBoard() {
  errTrip = false;
  try {
    for (let i = 0; i < dbState.grid.length; i++) {
      $(`row${i}`).innerHTML = dbState.grid[i].replaceAll("0", "🟩")  // empty
                                              .replaceAll("1", "⬛")  // wall
                                              .replaceAll("2", "🍎")  // apple
                                              .replaceAll("3", "🟨")  // snake (any);
    }

    // snake head
    let pos_head = dbState.snake_pos[0]
    let pos_tail = dbState.snake_pos.at(-1);
    $(`row${pos_head[0]}`).innerHTML = stringCharReplace($(`row${pos_head[0]}`).innerHTML, "😶", pos_head[1]);
    $(`row${pos_tail[0]}`).innerHTML = stringCharReplace($(`row${pos_tail[0]}`).innerHTML, "🟡", pos_tail[1]);

    setButtons(); // consider taking into this function? maybe??

    $("next-move").innerHTML = (new Date(dbState.next_ts)).toLocaleTimeString();
    $("current-move").innerHTML = dbState.move;

    if (!errTrip) { $("error-message").setAttribute("hidden", true); }
  } catch (error) {
    showError("Error in parsing database, please report if this keeps repeating");
    console.error(error);
  }
};

function setButtons() {
  for (let i = 0; i < 3; i++) {
    let char = "";

    if (lastVoteTs > dbState.last_ts && !MULTIVOTE) {
      $(`button${i}`).setAttribute("disabled", true);
    } else {
      $(`button${i}`).removeAttribute("disabled");
      lastVoteChoice = null;
    }
    $(`button${i}`).className = "";

    let dir = (dbState.last_dir - 1 + i) % 4;
    while (dir < 0) { dir = 4 + dir; }
    switch (dir) {
      case 0:
        char = "➡️"
        break;
      case 1:
        char = "⬇️"
        break;
      case 2:
        char = "⬅️"
        break;
      case 3:
        char = "⬆️"
        break;
      default:
        char = "❓"
        $(`button${i}`).setAttribute("disabled", true);
        showError("Error: Invalid last move")
        break;
    }
    $(`button${i}`).innerHTML = `${dbState.votes[i]} ${char}`;
  }

  if (lastVoteChoice) {
    $(`button${lastVoteChoice}`).innerHTML += "✅";
    $(`button${lastVoteChoice}`).classList.add("chosen-vote");
  }
}

/** @param {Event} buttonState  */ // this is here because I'm not using typescript yet...
function sendVote(buttonState) {
  let buttonId = buttonState.target.id.split("button")[1];
  lastVoteTs = Date.now();
  lastVoteChoice = buttonId
  updateStorage();

  $("button0").setAttribute("disabled", true);
  $("button1").setAttribute("disabled", true);
  $("button2").setAttribute("disabled", true);

  fetch(CONST.SERVERURL + `/api/votes/${buttonId}`, { method: "POST" })
  .then(() => {
    // do not add button editing, as the database would have been fetched right before this
    // (and button would have been consqquently edited)
  }).catch((error) => {
    showError("Vote could not be sent!!!");
    $(`button${buttonId}`).innerHTML += "🛑";
    $(`button${buttonId}`).classList.add("chosen-vote");
  });
}

function newMove() {
  try {
    // set up local db copy and base of new game state
    const tmpState = structuredClone(dbState); // this is so dbState doesn't get overridden
    let newState = {
      "apple_pos": tmpState.apple_pos,
      "last_ts": Date.now(),
      "move": tmpState.move + 1,
      "next_ts": Date.now() + MOVEDELAY,
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
    if (tmpState.votes[voteIndex] === tmpState.votes[1]) {
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
    if (pos[0] < 0 || pos[0] >= dbState.grid.length) {
      throw new Error("Game_WallHit");
    }
    if (pos[1] < 0 || pos[1] >= dbState.grid[0].length) {
      throw new Error("Game_WallHit");
    }
    const currentTile = dbState.grid[pos[0]][pos[1]];

    

    // make new grid
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
        const newPlacement = [randomInt(0, dbState.grid.length), randomInt(0, dbState.grid[0].length)];

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

    // publish
    newState.grid = grid;
    set(ref(database), newState);
  } catch (err) {
    if (err.message === "Game_WallHit") {
      set(ref(database), CONST.DEFAULTSTATE())
    } else if (err.message === "Game_NoVotes") {
      let tmpState = structuredClone(dbState);
      tmpState.last_ts = Date.now();
      tmpState.move += 1;
      tmpState.next_ts = Date.now() + MOVEDELAY;
      tmpState.votes = [0, 0, 0];

      set(ref(database), tmpState);
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
      tmpState.move = dbState.move + 1;
      
      set(ref(database), tmpState);
      setTimeout(() => showError("the game has been won!!!"), 1000);
    } else {
      console.error(err);
    }
  }
}


// firefox ignores the default attributes if the page is not hard-reloaded
$("button0").setAttribute("disabled", true);
$("button1").setAttribute("disabled", true);
$("button2").setAttribute("disabled", true);

// database connection
setInterval(() => {
  fetch(CONST.SERVERURL + "/api/state")
  .then((res) => res.json())
  .then((json_res) => {
    dbState = json_res;
    updateBoard(dbState);
  });
}, 1000);

// wiring up buttons
$("button0").addEventListener("click", sendVote);
$("button1").addEventListener("click", sendVote);
$("button2").addEventListener("click", sendVote);

// new move
setInterval(() => {
  if (Date.now() > dbState?.next_ts) {
    newMove();
  }
}, randomInt(5000, 10000));



// dev, very unsafe
if (DEVMODE) {
  addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowRight":
        window.DEV_CUSTOMMOVE(0);
        break;
      case "ArrowDown":
        window.DEV_CUSTOMMOVE(1);
        break;
      case "ArrowLeft":
        window.DEV_CUSTOMMOVE(2);
        break;
      case "ArrowUp":
        window.DEV_CUSTOMMOVE(3);
        break;
      case "c":
        // if you set this key to "r" or "R" reloading the page becomes hard :P
        window.DEV_RESETSTATE();
        break;
      case "n":
        newMove();
        break;
    }
  });

  window.DEV_BLOCKEDSTATE = CONST.DEFAULTSTATE();
  window.DEV_BLOCKEDSTATE.last_ts = -1;

  window.DEV_GETVARS = () => {return [lastVoteTs, dbState]};
  window.DEV_PUSHSTATE = content => set(ref(database), content);
  window.DEV_RESETSTATE = () => window.DEV_PUSHSTATE(CONST.DEFAULTSTATE());
  window.DEV_RESETTIME = () => {set(ref(database, "last_ts"), Date.now())}
  window.DEV_SYNCSTATE = () => {get(ref(database)).then((state) => {dbState = state.val(); updateBoard();})}
  window.DEV_BYPASSLOCK = () => {lastVoteTs = 0; updateBoard();}
  window.DEV_CUSTOMMOVE = (dir) => {dbState.last_dir = dir; dbState.votes[1] = 1e100; newMove();}
  window.DEV_DEFAULTSTATE = () => CONST.DEFAULTSTATE();

  window.$ = $;
}