import * as CONST from "../src/constants.js"
import * as funct from "../src/functions.js"
import express from 'express';

const DEVMODE = (process.env.NODE_ENV === "development");
const LISTENPORT = DEVMODE ? 8080 : 80;
const MOVEDELAY = DEVMODE ? CONST.MOVEDELAY_DEV : CONST.MOVEDELAY


let gameState = CONST.DEFAULTSTATE();
gameState.game_id = crypto.randomUUID();

const app = express();
app.use((req, res, next) => {
  DEVMODE && res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});


if (DEVMODE) {
  app.get("/api", (req, res) => {
    res.json({
      dev: DEVMODE,
      delay: MOVEDELAY,
      state: gameState,
    });
  });

  app.get("/api/devel/newgame", (req, res) => {
    gameState = CONST.DEFAULTSTATE();
    gameState.game_id = crypto.randomUUID();

    res.json({
      dev: DEVMODE,
      delay: MOVEDELAY,
      state: gameState,
    });
  });

  app.get("/api/devel/newtick", (req, res) => {
    gameState = funct.newMove(gameState);
    res.json({
      dev: DEVMODE,
      delay: MOVEDELAY,
      state: gameState
    })
  });
};

app.get("/api/state", (req, res) => {
  res.json(gameState)
});

for (let i = 0; i < 3; i++) {
  app.post(`/api/votes/${i}`, (req, res) => {
    gameState.votes[i]++;
    res.json({ voted: i });
  });
}

app.listen(LISTENPORT, (err) => {
  if (!err) { console.log("Server is up!"); }
  else { console.error(err); };
});

setInterval(() => {
  if (gameState.next_ts < Date.now()) {
    gameState = funct.newMove(gameState);
  }
}, 1000)