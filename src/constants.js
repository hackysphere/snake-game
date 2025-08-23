// NOTE TO SELF: grid length and width is hardcoded in DEFAULTSTATE

export const MOVEDELAY = 60000;
export const MOVEDELAY_DEV = 15000;

export const DEFAULTSTATE = (() => { return {
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
  "next_ts": Date.now() + MOVEDELAY,
  "snake_pos": [
    [2, 1],
    [2, 0],
  ],
  "start_ts": Date.now(),
  "votes": [0, 0, 0]
}});

// move to .env file?
export const SERVERURL = "http://localhost:8080";
