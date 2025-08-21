import * as CONST from "../src/constants.js"
import express from 'express';

const DEVMODE = (process.env.NODE_ENV === "development");

const LISTENPORT = (() => {
  if (DEVMODE) { return 8080; }
  else { return 80; }
})();
// const MOVEDELAY = game_MOVEDELAY;
const MOVEDELAY = (() => {
  // milliseconds due to Date.now()
  if (!DEVMODE) { return CONST.MOVEDELAY; }
  else { return CONST.MOVEDELAY_DEV; }
})();
let gameState = CONST.DEFAULTSTATE();

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

app.listen(LISTENPORT, (err) => {
  if (!err) { console.log("Server is up!"); }
  else { console.error(err); };
});
