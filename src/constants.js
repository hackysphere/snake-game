// NOTE TO SELF: grid length and width is hardcoded in DEFAULTSTATE

export const MOVEDELAY = 60000;
export const MOVEDELAY_DEV = 15000;

export const DEFAULTSTATE = (() => { return {
  "game_id": null,

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

export const WINSTATE = (() => { return {
  "game_id": null,

  "apple_pos": [2, 4],
  "grid": [
    "33332",
    "33333",
    "33333",
    "33333",
    "33333",
  ],
  "last_dir": 0,
  "last_ts": 0,
  "move": 1,
  "next_ts": Date.now() + 2000,
  "snake_pos": [
    [0, 3],
    [0, 2],
    [0, 1],
    [0, 0],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [1, 4],
    [2, 4],
    [2, 3],
    [2, 2],
    [2, 1],
    [2, 0],
    [3, 0],
    [3, 1],
    [3, 2],
    [3, 3],
    [3, 4],
    [4, 4],
    [4, 3],
    [4, 2],
    [4, 1],
    [4, 0]
  ],
  "start_ts": Date.now(),
  "votes": [0, 1, 0]
}});

// move to .env file?
export const SERVERURL = "http://localhost:8080";
