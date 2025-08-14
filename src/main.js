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



const MOVEDELAY = 120;
let dbState;
let lastVoteTs = 0;  // TODO: use cookies or something to prevent double voting

function showError(message) {
  document.getElementById("error-message").removeAttribute("hidden");
  document.getElementById("error-message").innerHTML = message ? message : "An undefined error has occured.";
}

function updateBoard(state) {
  console.log(state);
  try {
    $("row0").innerHTML = dbState.grid[0];
    $("row1").innerHTML = dbState.grid[1];
    $("row2").innerHTML = dbState.grid[2];
    $("row3").innerHTML = dbState.grid[3];
    $("row4").innerHTML = dbState.grid[4];
    document.getElementById("error-message").setAttribute("hidden", true);
  } catch (error) {
    showError("Error in parsing database, please report if this keeps repeating");
    console.error("Error in parsing database, please report if this keeps repeating");
  }
};

function resetState() {
  set(ref(database), {
    "grid": [
      "00000",
      "00000",
      "33020",
      "00000",
      "00000",
    ],
    "last_dir": 0,
    "move": 1,
    "next_ts": Date.now() + MOVEDELAY,
    "snake_pos": [
      "2,1",
      "2,0",
    ],
    "start_ts": Date.now(),
    "votes": {
      "0": 0,
      "1": 0,
      "2": 0,
    },
  });
  lastVoteTs = 0;
};


onValue(ref(database), snapshot => {
  dbState = snapshot.val();
  updateBoard(snapshot.val());
});
