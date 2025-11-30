# snake-game

## READ!!
this is still very subject to change, and not stable yet  
proceed with caution
## normal content follows

this is an attempt at making a multiplayer game of snake which runs on a single global game board  
it doesn't have any auth (all anonymous requests), and has *very minimal* request checking  
this does not use a database, rather all data is kept in memory and restarted from scratch when server is reloaded

"database" schema can be found in [docs/db-schema.md](docs/db-schema.md)

some logging is done to console output through winston, logging level can be changed in `backend/server.js`

## installation
### shared steps
1. clone this repo
1. make a copy of `.env.example` as `.env`
1. edit the environment variables to match your setup
    * `APP_URL`: change to the full URL where this will be accessible at (cannot be at a subpath)
    * `USING_TRUSTED_PROXY`: set to true if you are using a proxy (nginx, caddy, cloudflare) 
        * if you are using a proxy, **MAKE SURE** that it sends a *safe* X-Forwarded-For header, and that the client IP is the first/leftmost one (configure your proxy if the wrong IP shows up)
    * `NODE_LOG_LEVEL`: change to `http` if you want a log printed for each network request

### docker compose-specific steps
run `docker compose up -d`  
the game is exposed by default on port 8012

if you change anything in `.env`, you will have to run `docker compose up -d --build --force-recreate` after saving changes

### running from source-specific steps
1. [install pnpm](https://pnpm.io/installation)
1. install dependencies with `pnpm install`
1. run `pnpm serve-full`  
the game is exposed by default on port 8012, so you will probably want to proxy this if you don't want to give everyone a url of `http://domain:8012`
* remember to change `NODE_USING_TRUSTED_PROXY` if choosing to use a proxy!

## contributing/development
1. [install pnpm](https://pnpm.io/installation)
1. install dependencies with `pnpm install`

### when running in development
* run `pnpm dev` in one terminal to serve the vite app
* run `pnpm serve-dev` in another terminal to serve the API

`main.js` has two constants at the top of the file that can be changed to enable or disable development features  
`.env` is currently not applied when in development because of hardcoded local ports and URLs  
logging amount can be changed through the `LOG_LEVEL` constant in [backend/server.js](backend/server.js)

### notes on docker
the dockerfile is taken from pnpm documentation, and as such it may have issues with CI/CD services  
CI/CD workflows are not implemented because vite uses environment variables in order to set the server URL during build time, which happens during the docker image build
* i may fix this if i have some extra time