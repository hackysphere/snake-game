// TODO: convert to typescript or something for better type *hinting* (not really checking)
// also this file is just a big clump of things *_*

import * as CONST from "./constants.js";
import * as funct from "./functions.js";
const $ = (id) => {
  return document.getElementById(id);
};

// these will always be disabled in production due to vite build states
const DEVMODE = import.meta.env.DEV && !false;
const MULTIVOTE = import.meta.env.DEV && false;
if (import.meta.env.DEV) {
  $("dev-build").removeAttribute("hidden");
  if (DEVMODE) {
    $("dev-build-data").innerHTML += "DEVMODE ";
  }
  if (MULTIVOTE) {
    $("dev-build-data").innerHTML += "MULTIVOTE ";
  }
}
const SERVERURL = DEVMODE ? "http://localhost:8080" : window.location.origin;

/**
 * Variables to prevent easy doublevoting
 * Must be also set in updateStorage and sendVote
 * There is probably a better way to do this
 */
let lastVoteChoice = localStorage.getItem("vote_lastChoice") ?? null;
let lastGameId = localStorage.getItem("lastGameId") ?? null;
let lastGameMove = localStorage.getItem("vote_lastGameMove") ?? 0;

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
 * This is only called when voting for a move
 */
function updateStorage() {
  localStorage.setItem("vote_lastChoice", lastVoteChoice);
  localStorage.setItem("lastGameId", lastGameId);
  localStorage.setItem("vote_lastGameMove", lastGameMove);
}

function updateBoard() {
  errTrip = false;
  try {
    for (let i = 0; i < dbState.grid.length; i++) {
      $(`row${i}`).innerHTML = dbState.grid[i]
        .replaceAll("0", "🟩") // empty
        .replaceAll("1", "⬛") // wall
        .replaceAll("2", "🍎") // apple
        .replaceAll("3", "🟨"); // snake (any);
    }

    // snake head
    let pos_head = dbState.snake_pos[0];
    let pos_tail = dbState.snake_pos.at(-1);
    $(`row${pos_head[0]}`).innerHTML = funct.stringCharReplace(
      $(`row${pos_head[0]}`).innerHTML,
      "😶",
      pos_head[1],
    );
    $(`row${pos_tail[0]}`).innerHTML = funct.stringCharReplace(
      $(`row${pos_tail[0]}`).innerHTML,
      "🟡",
      pos_tail[1],
    );

    setButtons(); // consider taking into this function? maybe??

    $("next-move").innerHTML = new Date(dbState.next_ts).toLocaleTimeString();
    $("current-move").innerHTML = dbState.move;

    if (dbState.grid[0][0] === "✅") {
      showError("the game has been won!!!");
    }

    if (!errTrip) {
      $("error-message").setAttribute("hidden", true);
    }
  } catch (error) {
    showError("Error in parsing database, please report if this keeps repeating");
    console.error(error);
  }
}

function setButtons() {
  for (let i = 0; i < 3; i++) {
    let char = "";

    if (lastGameMove >= dbState.move && lastGameId === dbState.game_id && !MULTIVOTE) {
      $(`button${i}`).setAttribute("disabled", true);
    } else {
      $(`button${i}`).removeAttribute("disabled");
      lastVoteChoice = null;
    }
    $(`button${i}`).className = "";

    let dir = funct.getDirWithOffset(dbState.last_dir, i);

    switch (dir) {
      case 0:
        char = "➡️";
        break;
      case 1:
        char = "⬇️";
        break;
      case 2:
        char = "⬅️";
        break;
      case 3:
        char = "⬆️";
        break;
      default:
        char = "❓";
        $(`button${i}`).setAttribute("disabled", true);
        showError("Error: Invalid last move");
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
  lastVoteChoice = buttonId;
  lastGameId = dbState.game_id;
  lastGameMove = dbState.move;
  updateStorage();

  $("button0").setAttribute("disabled", true);
  $("button1").setAttribute("disabled", true);
  $("button2").setAttribute("disabled", true);

  fetch(SERVERURL + `/api/votes/${buttonId}`, { method: "POST" })
    .then(() => {
      pullAndUpdate();
    })
    .catch((error) => {
      showError("Vote could not be sent!!!");
      $(`button${buttonId}`).innerHTML += "🛑";
      $(`button${buttonId}`).classList.add("chosen-vote");
    });
}

function pullAndUpdate() {
  fetch(SERVERURL + "/api/state")
    .then((res) => res.json())
    .then((json_res) => {
      dbState = json_res;
      updateBoard(dbState);
    });
}

// HACK: firefox ignores the default attributes if the page is not hard-reloaded
$("button0").setAttribute("disabled", true);
$("button1").setAttribute("disabled", true);
$("button2").setAttribute("disabled", true);

// wiring up buttons
$("button0").addEventListener("click", sendVote);
$("button1").addEventListener("click", sendVote);
$("button2").addEventListener("click", sendVote);

// database connection
setInterval(() => {
  pullAndUpdate();
}, 7000);

// load it once so that loading doesn't take 7 seconds
pullAndUpdate();

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
        window.DEV_NEXTMOVE();
        break;
      case "l":
        pullAndUpdate();
        break;
    }
  });

  window.DEV_GETVARS = () => {
    return [lastGameMove, dbState];
  };
  window.DEV_RESETSTATE = () => {
    fetch(SERVERURL + "/api/devel/newgame");
    pullAndUpdate();
  };
  window.DEV_BYPASSLOCK = () => {
    lastGameMove = 0;
    updateBoard();
  };
  window.DEV_CUSTOMMOVE = (dir) => {
    let voteindex;
    if (dbState.last_dir === dir) {
      voteindex = 1;
    } else if ((dbState.last_dir + 1 + 4) % 4 === dir) {
      voteindex = 2;
    } else if ((dbState.last_dir - 1 + 4) % 4 === dir) {
      voteindex = 0;
    } else {
      return;
    }
    fetch(SERVERURL + `/api/votes/${voteindex}`, { method: "POST" });
    pullAndUpdate();
  };
  window.DEV_DEFAULTSTATE = () => CONST.DEFAULTSTATE();
  window.DEV_NEXTMOVE = () => {
    fetch(SERVERURL + "/api/devel/newtick");
    pullAndUpdate();
  };

  window.$ = $;
}
