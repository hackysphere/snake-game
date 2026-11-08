archived, very unlikely I will work on this again

---

# snake-game
this is an attempt at making a multiplayer game of snake which runs on a single global game board  
it doesn't have any auth (all anonymous requests), and has _very minimal_ request checking  
this does not use a database, rather all data is kept in memory and restarted from scratch when server is reloaded

each client also pings your server once every 7 seconds (because I didn't do sockets), so make sure that's okay, I guess?

## installation
the game is exposed by default on port 8012, so you will probably want to proxy this if you don't want to give everyone a url of `http://domain:8012`

remember to change `NODE_USING_TRUSTED_PROXY` if choosing to use a proxy!

### run through docker compose
1. get the [docker-compose.yml](docker-compose.yml)
1. [set up the environment variables](#environment-variables)
1. configure the exposed port if needed, otherwise the game is exposed on 8012 by default
1. run `docker compose up -d`

### run using node
#### build the project
1. [install pnpm](https://pnpm.io/installation)
1. clone this repo
1. make a copy of `.env.example` as `.env`
1. [edit the environment variables](#environment-variables) in `.env` to match your setup
1. install dependencies with `pnpm install`
1. run `pnpm build`

#### serve the project
run `pnpm serve`

### environment variables
- `APP_URL`: change to the full URL where this will be accessible at (cannot be at a subpath)
  - this is used to check that requests are coming from the same address as the game (very basic "anticheat")
- `USING_TRUSTED_PROXY`: set to true if you are using a proxy (nginx, caddy, cloudflare)
  - if you are using a proxy, **MAKE SURE** that it sends a _safe_ X-Forwarded-For header, and that the client IP is the first/leftmost one (configure your proxy if the wrong IP shows up)
- `NODE_LOG_LEVEL`: set to `http` if you want a log printed for each network request

## development
1. [install pnpm](https://pnpm.io/installation)
1. install dependencies with `pnpm install`
1. run `pnpm dev` in one terminal to serve the vite app
1. run `pnpm serve-dev` in another terminal to serve the API

`main.js` has two constants at the top of the file that can be changed to enable or disable development features  
`.env` is currently not applied when in development because of hardcoded local ports and URLs  
logging amount can be changed through the `LOG_LEVEL` constant in `server.js`

# db schema
- root: object
  - game_id: str  
    holds the current game id (just a random UUID, reset on each game cycle)

  - apple_pos: int[]  
    holds position of apple
  - grid: array
    holds the current status of the grid
    - [0] - [4]: str (grid_row)  
      holds the state of a row
  - last_dir: int (dir)  
    holds the last direction of movement
  - last_ts: int  
    holds the timestamp of the previous move
  - move: int  
    holds the current move number of the "round"  
    not required for game logic
  - next_ts: int  
    holds the timestamp of when the next move should be played  
    not required for proper game logic
  - snake_pos: array
    holds the positions of snake body
    - \[\*]: int[]
      holds the position of a snake part in `[x, y]`
  - start_ts: int  
    holds the timestamp of the start of the round  
    not required for game logic
  - votes: int[]
    holds the current number of votes for the corresponding direction choice (deterministic)

## "types"
### grid_row
string of int, can be:
- 0: empty square
- 1: wall (currently unused)
- 2: apple
- 3: snake

### last_dir
int, can be:
- 0: right
- 1: down
- 2: left
- 3: up
