#!/bin/bash
cd shared
yarn build
cd ..
yarn build:functions
./node_modules/.bin/gents ./shared/src/gen
cd shared
yarn build
cd ..
cp -r images client/src/assets/