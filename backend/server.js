import * as CONST from "../src/constants.js"
import * as funct from "../src/functions.js"
import express from 'express';

const DEVMODE = (process.env.NODE_ENV === "development");
const LISTENPORT = DEVMODE ? 8080 : 80;
const MOVEDELAY = DEVMODE ? CONST.MOVEDELAY_DEV : CONST.MOVEDELAY
let gameState = CONST.DEFAULTSTATE();

const app = express();
app.use((req, res, next) => {
  DEVMODE
  ? res.setHeader("Access-Control-Allow-Origin", "*")
  : res.setHeader("Access-Control-Allow-Origin", CONST.CLIENTURL);
  
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
    if (!DEVMODE && req.headers.origin !== CONST.CLIENTURL) {
      // someone is trying to vote from something that is definetely not the client
      res.status(400);
      res.send();
      return;
    };
    gameState.votes[i]++;
    res.status(200);
    res.send();
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