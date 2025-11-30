# snake-game
this is an attempt at making a multiplayer game of snake which runs on a single global game board  
it doesn't have any auth (all anonymous requests), and has *very minimal* request checking  
this does not use a database, rather all data is kept in memory and restarted from scratch when server is reloaded

"database" schema can be found in [docs/db-schema.md](docs/db-schema.md)  
some logging is done to console output through winston, logging level can be changed in `backend/server.js`

each client also pings your server one time per second (because I didn't do sockets), so make sure that's okay, I guess?

## installation

### docker compose-specific steps
1. get the [docker-compose.yml](docker-compose.yml)
1. [set up the environment variables](#environment-variables)
1. configure the exposed port if needed, otherwise the game is exposed on 8012 by default
1. run `docker compose up -d`

### shared steps
1. [install pnpm](https://pnpm.io/installation)
1. clone this repo
1. make a copy of `.env.example` as `.env`
1. [edit the environment variables](#environment-variables) in `.env` to match your setup
1. install dependencies with `pnpm install`
1. run `pnpm build`
1. run `pnpm serve`

for restarts, you should only need to run `pnpm serve`

the game is exposed by default on port 8012, so you will probably want to proxy this if you don't want to give everyone a url of `http://domain:8012`
* remember to change `NODE_USING_TRUSTED_PROXY` if choosing to use a proxy!

### environment variables
* `APP_URL`: change to the full URL where this will be accessible at (cannot be at a subpath)
* `USING_TRUSTED_PROXY`: set to true if you are using a proxy (nginx, caddy, cloudflare) 
    * if you are using a proxy, **MAKE SURE** that it sends a *safe* X-Forwarded-For header, and that the client IP is the first/leftmost one (configure your proxy if the wrong IP shows up)
* `NODE_LOG_LEVEL`: change to `http` if you want a log printed for each network request

## contributing/development
before spending time on this project, please consider that this is mostly a learning project that I did to learn fullstack web development, and that I won't be able to provide much support.  
however, if you do want to contribute:

1. [install pnpm](https://pnpm.io/installation)
1. install dependencies with `pnpm install`
1. run `pnpm dev` in one terminal to serve the vite app
1. run `pnpm serve-dev` in another terminal to serve the API

`main.js` has two constants at the top of the file that can be changed to enable or disable development features  
`.env` is currently not applied when in development because of hardcoded local ports and URLs  
logging amount can be changed through the `LOG_LEVEL` constant in [backend/server.js](backend/server.js)
