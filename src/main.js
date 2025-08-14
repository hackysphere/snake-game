// TODO: convert to typescript or something for better type *hinting* (not really checking)

const $ = (id) => {return document.getElementById(id)};

import { initializeApp } from "firebase/app";
import { getDatabase, ref, child, set, get, onValue } from "firebase/database";  // TODO: remove unneeded functions

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



// const MOVEDELAY = 120000;  // milliseconds due to Date.now()
const MOVEDELAY = 15000; // FIXME: dev
let lastVoteTs = 0;  // TODO: use cookies or something to prevent double voting
let lastVoteChoice = null;  // TODO: better with cookies
let dbState;
let errTrip = false;

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
    let content = Array.from($(`row${pos[0]}`).innerHTML);
    content[pos[1]] = "😶";
    $(`row${pos[0]}`).innerHTML = content.join("");

    setButtons(); // consider taking into this function? maybe??

    $("next-move").innerHTML = (new Date(dbState.next_ts)).toLocaleTimeString();

    if (!errTrip) { $("error-message").setAttribute("hidden", true); }
  } catch (error) {
    showError("Error in parsing database, please report if this keeps repeating");

    console.error(error); //dev
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

/** @param {Event} state  */ // this is here because JSDoc and not TS typing hints
function sendVote(state) {
  let buttonId = state.target.id.split("button")[1];
  lastVoteTs = Date.now();
  lastVoteChoice = buttonId

  $("button0").setAttribute("disabled", true);
  $("button1").setAttribute("disabled", true);
  $("button2").setAttribute("disabled", true);

  set(ref(database, `votes/${buttonId}`), dbState.votes[buttonId] + 1)
  .then(() => {
    // do not add button editing, as the database would have been fetched right before this
  }).catch(() => {
    showError("Vote could not be sent!!!");
    $(`button${buttonId}`).innerHTML += "🛑";
    $(`button${buttonId}`).classList.add("chosen-vote");
  });
}

// firefox ignores the default attributes if the page is not hard-reloaded
$("button0").setAttribute("disabled", true);
$("button1").setAttribute("disabled", true);
$("button2").setAttribute("disabled", true);

onValue(ref(database), snapshot => {
  dbState = snapshot.val();
  updateBoard(snapshot.val());
});

// wiring up buttons
$("button0").addEventListener("click", sendVote);
$("button1").addEventListener("click", sendVote);
$("button2").addEventListener("click", sendVote);



// dev, very unsafe
if (!false) {
  window.DEV_DEFAULTSTATE = {
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
    "next_ts": Date.now() + MOVEDELAY,
    "snake_pos": [
      [2, 1],
      [2, 0],
    ],
    "start_ts": Date.now(),
    "votes": {
      "0": 0,
      "1": 0,
      "2": 0,
    }
  };

  window.DEV_BLOCKEDSTATE = structuredClone(window.DEV_DEFAULTSTATE);
  window.DEV_BLOCKEDSTATE.last_ts = -1;

  window.DEV_GETVARS = () => {return [lastVoteTs, dbState]};
  window.DEV_PUSHSTATE = content => set(ref(database), content);
  window.DEV_RESETSTATE = () => window.DEV_PUSHSTATE(DEV_DEFAULTSTATE);
  window.DEV_RESETTIME = () => {set(ref(database, "last_ts"), Date.now())}

  window.$ = $;
}