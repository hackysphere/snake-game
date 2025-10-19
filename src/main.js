// TODO: convert to typescript or something for better type *hinting* (not really checking)
// game also breaks if snake is at size 24 or 25...
// also this file is just a big clump of things *_*

import * as CONST from "./constants.js";
import * as funct from "./functions.js";
const $ = (id) => {return document.getElementById(id)};

// these will always be disabled in production due to vite build states
const DEVMODE = import.meta.env.DEV && !false
const MULTIVOTE = import.meta.env.DEV && false
if (import.meta.env.DEV) {
  $("dev-build").removeAttribute("hidden");
  if (DEVMODE) { $("dev-build-data").innerHTML += "DEVMODE "; }
  if (MULTIVOTE) { $("dev-build-data").innerHTML += "MULTIVOTE "; }
}


let lastVoteTs = localStorage.getItem("vote_lastTs") ?? 0;
let lastVoteChoice = localStorage.getItem("vote_lastChoice") ?? null;
let lastGameId = localStorage.getItem("lastGameId") ?? null;
let dbState;
let errTrip = false;


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
  localStorage.setItem("lastGameId", lastGameId);
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
    $(`row${pos_head[0]}`).innerHTML = funct.stringCharReplace($(`row${pos_head[0]}`).innerHTML, "😶", pos_head[1]);
    $(`row${pos_tail[0]}`).innerHTML = funct.stringCharReplace($(`row${pos_tail[0]}`).innerHTML, "🟡", pos_tail[1]);

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

    if (lastVoteTs > dbState.last_ts && lastGameId == dbState.game_id && !MULTIVOTE) {
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
  lastVoteChoice = buttonId;
  lastGameId = dbState.game_id;
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

// // new move
// setInterval(() => {
//   if (Date.now() > dbState?.next_ts) {
//     newMove();
//   }
// }, randomInt(5000, 10000));



// dev, very unsafe
if (DEVMODE) {
  // addEventListener("keydown", (e) => {
  //   switch (e.key) {
  //     case "ArrowRight":
  //       window.DEV_CUSTOMMOVE(0);
  //       break;
  //     case "ArrowDown":
  //       window.DEV_CUSTOMMOVE(1);
  //       break;
  //     case "ArrowLeft":
  //       window.DEV_CUSTOMMOVE(2);
  //       break;
  //     case "ArrowUp":
  //       window.DEV_CUSTOMMOVE(3);
  //       break;
  //     case "c":
  //       // if you set this key to "r" or "R" reloading the page becomes hard :P
  //       window.DEV_RESETSTATE();
  //       break;
  //     // case "n":
  //     //   newMove();
  //     //   break;
  //   }
  // });

  window.DEV_BLOCKEDSTATE = CONST.DEFAULTSTATE();
  window.DEV_BLOCKEDSTATE.last_ts = -1;

  window.DEV_GETVARS = () => {return [lastVoteTs, dbState]};
  // window.DEV_PUSHSTATE = content => set(ref(database), content);
  // window.DEV_RESETSTATE = () => window.DEV_PUSHSTATE(CONST.DEFAULTSTATE());
  // window.DEV_RESETTIME = () => {set(ref(database, "last_ts"), Date.now())}
  window.DEV_SYNCSTATE = () => {get(ref(database)).then((state) => {dbState = state.val(); updateBoard();})}
  window.DEV_BYPASSLOCK = () => {lastVoteTs = 0; updateBoard();}
  // window.DEV_CUSTOMMOVE = (dir) => {dbState.last_dir = dir; dbState.votes[1] = 1e100; newMove();}
  window.DEV_DEFAULTSTATE = () => CONST.DEFAULTSTATE();

  window.$ = $;
}