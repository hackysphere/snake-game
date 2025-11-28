import * as CONST from "../src/constants.js"
import * as funct from "../src/functions.js"
import express from 'express';

import winston from 'winston';
const { timestamp, printf, colorize, align } = winston.format;

const DEVMODE = (process.env.NODE_ENV === "development");
const LISTENPORT = DEVMODE ? 8080 : 80;
const MOVEDELAY = DEVMODE ? CONST.MOVEDELAY_DEV : CONST.MOVEDELAY
let gameState = CONST.DEFAULTSTATE();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    colorize({level: true}),
    timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
    align(),
    printf(((info) => `[${info.timestamp}] ${info.level}: ${info.message}`))
  ),
  transports: [
    new winston.transports.Console()
  ],
});

const app = express();
app.use((req, res, next) => {
  DEVMODE
  ? res.setHeader("Access-Control-Allow-Origin", "*")
  : res.setHeader("Access-Control-Allow-Origin", CONST.CLIENTURL);
  
  next();
});

app.use((req, res, next) => {
  logger.http(`request to ${req.path} from ${req.ip}`);

  next();
})


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
      logger.warn(`someone is trying to vote from ${req.headers.origin}`)
      res.status(500); // lie because why not
      res.send();
      return;
    };
    gameState.votes[i]++;
    res.status(200);
    res.send();
  });
}

if (!DEVMODE) {
  /*  this allows for express to serve the vite app as well, BUT it first must be built!!
  if in devmode, it is better to use a seperate vite process for HMR */
  app.use(express.static("dist/"))
}

app.listen(LISTENPORT, (err) => {
  if (!err) { console.log("Server is up!"); }
  else { console.error(err); };
});


setInterval(() => {
  if (gameState.next_ts < Date.now()) {
    logger.info(`new tick after gamestate:\n${JSON.stringify(gameState)}`)
    gameState = funct.newMove(gameState);
  }
}, 1000);