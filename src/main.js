// TODO: convert to typescript or something for better type *hinting* (not really checking)

const $ = (id) => {return document.getElementById(id)};
const DEVMODE = !false // FIXME set to true

import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, set, get, onValue, update, increment } from "firebase/database";

const firebaseConfig = {
  apiKey: "***REMOVED***",
  authDomain: "***REMOVED***",
  projectId: "***REMOVED***",
  storageBucket: "***REMOVED***.firebasestorage.app",
  messagingSenderId: "***REMOVED***",
  appId: "1:***REMOVED***:web:daa763b3039d0a414c1a9b",
  databaseURL: "https://***REMOVED***-default-rtdb.firebaseio.com",
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);



// milliseconds due to Date.now()
const MOVEDELAY = (() => {
  if (!DEVMODE) { return 120000; }
  else { return 15000;}
})();

let lastVoteTs = 0;         // FIXME use cookies to store these!!!
let lastVoteChoice = null;  // FIXME use cookies to store these!!!
let dbState;
let errTrip = false;

const DEFAULTSTATE = (() => { return {
  "apple_pos": [2, 3],
  "grid": [
    "00000",
    "00000",
    "33020",
    "00000",
    "00000",
  ],
  "last_dir": 0,
  "last_ts": 0,
  "move": 1,
  "next_ts": Date.now() + MOVEDELAY, // pageload var
  "snake_pos": [
    [2, 1],
    [2, 0],
  ],
  "start_ts": Date.now(), // pageload var
  "votes": [0, 0, 0]
}});

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
    let pos = dbState.snake_pos[0]
    $(`row${pos[0]}`).innerHTML = stringCharReplace($(`row${pos[0]}`).innerHTML, "😶", pos[1]);

    setButtons(); // consider taking into this function? maybe??

    $("next-move").innerHTML = (new Date(dbState.next_ts)).toLocaleTimeString();

    if (!errTrip) { $("error-message").setAttribute("hidden", true); }
  } catch (error) {
    showError("Error in parsing database, please report if this keeps repeating");
    console.error(error);
  }
};

function setButtons() {
  for (let i = 0; i < 3; i++) {
    let char = "";

    if (lastVoteTs > dbState.last_ts) {
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

  $("button0").setAttribute("disabled", true);
  $("button1").setAttribute("disabled", true);
  $("button2").setAttribute("disabled", true);

  let updates = {}
  updates[`votes/${buttonId}`] = increment(1)
  update(ref(database), updates)
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

    // winning vote and position calculation
    let voteIndex = 0;
    for (let i = 1; i < 3; i++) {
      if (tmpState.votes[i] > tmpState.votes[voteIndex]) {
        voteIndex = i;
      }
    }
    // set "default" to middle option/same path
    if (tmpState.votes[voteIndex] == tmpState.votes[1]) {
      voteIndex = 1;
    }
    if (tmpState.votes[0] === 0 && tmpState.votes[0] === tmpState.votes[1] === tmpState.votes[2]) {
      // TODO skip move?? or something else
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

    // wall check, removing tail (if needed)
    if (currentTile == "1") {
      throw new Error("Game_WallHit");
      // TODO this actually doesn't work because the grid gets generated from a clean slate,
      // and the db has no information on where walls are...
    } else if (!(currentTile == "2")) { // FIXME messy with apple setting piece of code
      newState.snake_pos = newState.snake_pos.slice(0, -1);
    }
    // put snake on grid
    for (let i = 0; i < newState.snake_pos.length; i++) {
      grid[newState.snake_pos[i][0]] = stringCharReplace(grid[newState.snake_pos[i][0]], "3", newState.snake_pos[i][1]);
    }

    // setting new apple position (if needed)
    if (currentTile == "2") {
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
    }
    // put apple on grid
    grid[newState.apple_pos[0]] = stringCharReplace(grid[newState.apple_pos[0]], "2", newState.apple_pos[1]);

    // check if hitting self from NEW state
    if (["3"].includes(grid[pos[0]][pos[1]])) {
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
      set(ref(database), DEFAULTSTATE())
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
onValue(ref(database), snapshot => {
  dbState = snapshot.val();
  updateBoard(snapshot.val());
});

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
        // if you set this key to "r" or "R" reloading becomes hard :P
        window.DEV_RESETSTATE();
        break;
      case "n":
        newMove();
        break;
    }
  });

  window.DEV_BLOCKEDSTATE = DEFAULTSTATE();
  window.DEV_BLOCKEDSTATE.last_ts = -1;

  window.DEV_GETVARS = () => {return [lastVoteTs, dbState]};
  window.DEV_PUSHSTATE = content => set(ref(database), content);
  window.DEV_RESETSTATE = () => window.DEV_PUSHSTATE(DEFAULTSTATE());
  window.DEV_RESETTIME = () => {set(ref(database, "last_ts"), Date.now())}
  window.DEV_SYNCSTATE = () => {get(ref(database)).then((state) => {dbState = state.val(); updateBoard();})}
  window.DEV_BYPASSLOCK = () => {lastVoteTs = 0; updateBoard();}
  window.DEV_CUSTOMMOVE = (dir) => {dbState.last_dir = dir; newMove()}
  window.DEV_DEFAULTSTATE = () => DEFAULTSTATE();
  window.DEV_NEWMOVE = () => newMove();

  window.$ = $;
}