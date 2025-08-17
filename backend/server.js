// BUG: some of the shared variables (ex: default state) should be imported in both JS files as a seperate module!!!
import express from 'express';

const DEVMODE = (process.env.NODE_ENV === "development");

const LISTENPORT = (() => {
  if (DEVMODE) { return 8080; }
  else { return 80; }
})();
// const MOVEDELAY = game_MOVEDELAY;
const MOVEDELAY = (() => {
  // milliseconds due to Date.now()
  if (!DEVMODE) { return 60000; }
  else { return 15000; }
})();
// let gameState = game_DEFAULTSTATE();
let gameState = {
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
};

const app = express();

if (DEVMODE) {
  app.get("/api", (req, res) => {
    res.json({
      dev: DEVMODE,
      delay: MOVEDELAY,
      state: gameState,
    })
  });
};

app.get("/api/state", (req, res) => {
  res.json(gameState)
});

for (let i = 0; i < 3; i++) {
  app.post(`/api/votes/${i}`, (req, res) => {
    gameState.votes[i]++;
    res.status(200);
  });
}

app.listen(LISTENPORT, () => {console.log("Server is up!")});
