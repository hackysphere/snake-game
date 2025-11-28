# snake-game
this is an attempt at making a multiplayer game of snake which runs on a single global game board  
it doesn't have any auth (all anonymous requests), and has *very minimal* request checking  
this does not use a database, rather all data is kept in memory and restarted from scratch when server is reloaded

database schema can be found in `docs/db-schema.md`

some logging is done to console output through winston, logging level can be changed in `backend/server.js`