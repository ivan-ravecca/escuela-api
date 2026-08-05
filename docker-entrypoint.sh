#!/bin/sh
set -eu

npm run db:wait
npm run db:init

exec node dist/app.js