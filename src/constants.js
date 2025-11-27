// NOTE TO SELF: grid length and width will always be set to 5x5 due to functions.js newMove

// these are only used in production, local URLs are used in development
export const CLIENTURL = "https://snake.hcks.dev";
export const SERVERURL = "https://api.snake.hcks.dev";

export const MOVEDELAY = 60000;
export const MOVEDELAY_DEV = 15000;

export const DEFAULTSTATE = (() => { return {
  "game_id": crypto.randomUUID(),

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

export const WINSTATE = (() => {
  let state = DEFAULTSTATE();
  state.apple_pos = [2, 4];
  state.grid = [
    "33332",
    "33333",
    "33333",
    "33333",
    "33333",
  ];

  state.snake_pos = [];
  for (let x = 0; x < 5; x++) {
    for (let y = 0; y < 5; y++) {
      if (x !== 0 || y !== 4) {
        state.snake_pos.push([x, y]);
      }
    }
  }

  return state;
});
