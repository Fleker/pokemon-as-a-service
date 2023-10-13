# Pokémon as a Service

![](/images/null144.png)

This repository allows you to build and administer your own Pokémon game for your community. You can play a demo of this game here:

**https://pokemon-as-a-service.web.app**

_TODO: Actually upload the game logic_

**Note:** This demo mode contains a limit to how many Pokémon you can catch. This limit can be disabled in a hosted version.

**Note:** This is a fan game. It's not an official game.

## Introduction

This is a web-based game using the latest web platform APIs and capabilities. It runs on Firebase: using SaaS tools like _Firestore_, _Firebase Auth_, _Firebase Storage_, _Firebase Hosting_, and _Cloud Functions_ to run in a serverless environment. It is able to scale to as many players as you need. This means it can work for a group of friends in a Discord server or a large business.

This serves as a platform, breaking out core features and platform features. This allows an administrator to update game content regularly without impacting core features. It also allows individual vendors implementations to have finer control over their instance such as restricting who is allowed to join.

## Features

It contains a fully-fledged set of features inspired by the Pokémon games and refined to work in a serverless, web-based context.

### Game Features

![](/images/raid.png)

![](/images/charmander.png)

* **Collect Pokémon:** Players can obtain Poké Balls to catch Pokémon. Pokémon may hold rare items. Some may even be _shiny_!
* **Day Care:** Players can send Pokémon into the Day Care to obtain eggs. Eggs will hatch into baby Pokémon.
* **PokéDex:** As players collect new Pokémon, they will fill their PokéDex. As they reach certain milestones, they will receive rewards.
* **Buy and Sell items:** Poké Balls can catch Pokémon but also serve as the primary currency. Players can purchase various items at the Mart and sell items they own. In the _Bazaar_, players can obtain rarer items using different forms of currency.
* **Move Tutor & Move Deleter:** Pokémon can have preset _variants_ which provide them with unique moves. There are many ways to obtain these variants.
* **Private & Public Trading:** Players can create trade rooms and trade Pokémon & items with each other. They can also use the _Global Trade System_ to post trades with all players. Certain Pokémon may evolve when traded.
* **Friend Safari:** As players trade with each other, they will unlock new zones of an area where they can catch more Pokémon.
* **Battles:** Players can send their Pokémon into battles in various _cups_ inspired by various Pokémon games. Battles execute in a _Cloud Function_ where your Pokémon will use specific moves autonomously until the battle ends.
* **Raids:** Up to 24 players can compete in multiplayer raids against strong boss Pokémon. Winning these raids will allow the player to catch this Pokémon and receive rewards.
* **Voyages:** Up to 4 players can participate in a multiplayer exploration along different themed paths to obtain Pokémon and rewards. At the end of a voyage these players will face a tough raid battle.
* **Game Corner & Radio Quizzes:** Players can compete every day in the lottery. They draw a lottery ticket and have a chance to win a prize. Radio quizzes ask the player a question and only if they guess the correct answer do they win a prize.
* **Berry Farming:** Players will occasionally get rewards such as berries, mints, and apricorns. They can purchase plots of land and plant these items, optionally adding fertilizer. After some time these plants will grow to fruition.
* **Quests:** To obtain key items and legendary Pokémon, players will have to go on thematic quests and complete several tasks.
* **Research Tasks:** Players can complete simple capture quests in order to receive a variety of rewards.
* **Travel:** Players can pick different real-world locations to catch Pokémon. Each location has specific metadata which may cause different kinds of Pokémon to appear. Every day, weather changes in every location, causing different kinds of Pokémon to appear.
* **Crafting:** Players may obtain a variety of crafting materials which they can use to create Apricorn Poké Balls, technical machines & records, and different kinds of bait.
* **Chatbot:** Chat with Professor Oak as a LLM powered by PaLM 2.

### Web Features

This game is built as a [Progressive Web App](https://web.dev/explore/progressive-web-apps), allowing players on any platform to install it and operate it just like any other app. It uses a variety of web features:

* Push notifications
* Custom link protocols
* Window controls overlay
* Custom file handlers
* Gyroscope
* Modern accessibility
  * Supports `forced-colors`, `prefers-reduced-motion`
* Advanced CSS features
  * Light/Dark themes
  * CSS variables
  * Web dialog backdrops
* `scheduler.yield`

## How to Host

First you'll need to create a new [Firebase project](https://console.firebase.google.com/) and configure a web app connection. You'll also want to setup Firestore, Cloud Functions, and Authentication.

1. Setup Firebase project
  1. Setup Firestore
  1. Setup Authentication and enable at least one provider. We recommend Google Sign-In.
  1. Setup Cloud Functions
  1. Setup Hosting
2. Clone this project: `git clone git@github.com:Fleker/pokemon-as-a-service.git`
3. Install dependencies in each subdirectory:

```
cd client && npm install
cd ../functions && npm install
cd ../shared && npm install
cd ../ && npm run install
```

4. Build shared data and regenerate additional files

```
cd functions && npm run build
cd ..
npm run build:gen
```

This step will have to be run prior to each deployment as it copies images to the right frontend directory and creates a bunch of files which are useful for strong type-safety.

5. Setup your project with the [Firebase CLI](https://firebaseopensource.com/projects/firebase/firebase-tools/)
6. Build the backend and deploy it with the Firebase CLI

```
cd functions
npm run build
firebase deploy --only functions
```

When doing this the first time, you may have to go through several steps before your code is fully deployed. This step will have to be done in the future when making any backend changes.

7. Setup Firebase on the client
  1. Go to project settings > Add Web App
  1. Copy configuration data and save to `client/src/app/service/firebase.config.ts`
8. Build the client and deploy it with the Firebase CLI

```
cd ../client
npm run build
firebase deploy --only hosting
```

If this was successful, you should be able to load your game at a publicly available URL. You should be able to login and your player account will be created automatically. Future changes to the frontend will need to go through this same step.

The frontend is built using [Angular](https://angular.io) as a single-page app.

### Running Tests

There are tests! These are critical for ensuring the game's logic fits with expectations, particularly given how many different exceptions exist in the game's canon. Many tests also enforce consistency, such as making sure every Pokémon has a valid sprite.

There are two places these tests exist. There aren't really any frontend tests.

```
cd functions && npm run test
```

and

```
cd shared && npm run test
```

It is highly recommended that tests are run prior to deployment.

### Firestore Rules

These are the rules for Firestore which are used to keep user data secure:

```
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userid} {
      allow read: if request.auth.uid == userid;
      allow write: if false;
    }
    match /users/{userid}/adventureLog/released {
      allow read: if request.auth.uid == userid;
      allow write: if false;
    }
    match /users/{userid}/adventureLog/itemHistory {
    	allow read: if request.auth.uid == userid;
      allow write: if false;
    }
    match /users/{userid}/chats/{document=**} {
      allow read: if request.auth.uid == userid;
      allow write: if request.auth.uid == userid;
    }
    match /gts/leaderboard {
    	allow read: if request.auth.uid != null;
    }
  	match /gts/{doc} {
    	allow read: if false;
    }
    match /hiddenItems/{doc} {
    	allow read: if false;
    }
    match /test/{doc} {
      allow read: if request.auth.uid != null;
      allow list: if false;
    }
    match /locations/{doc} {
    	allow read: if false;
    }
    match /raids/{doc} {
      allow get: if request.auth.uid != null;
      // Only list your own active raids
      allow list: if request.auth.uid == resource.data.host && resource.data.state == 0;
    }
    match /voyages/{doc} {
      allow get: if request.auth.uid != null;
      // Only list your own active raids
      allow list: if request.auth.uid == resource.data.host && resource.data.state == 0;
    }
    match /trades/{doc} {
    	allow get: if request.auth.uid != null;
      allow list: if request.auth.uid == resource.data.host.id;
    }
    match /admin/cron {
    	allow get: if true;
    }
  }
}
```

## Making Changes

As this game is setup as a hosted service, you are free to make whatever changes you want. However, some changes may conflict with the upstream changes and result in merge conflicts. Most low-impact changes will be found in the `functions/platform` and `shared/platform` directories. These are largely config-based files which administrators can use to keep game content regularly updated and fresh.

More complex code may be hosted in the `functions/vendor` and `shared/vendor` directories. These may be used for various files and functions which may be needed for your specific implementation and are more than just tweaking a few constants.

### Running locally

To start a local instance of the frontend, with the backend being production, you can run:

```
cd client
npm run start
```

This will create a hosted instance at http://localhost:4200.

#### End port forcibly
`lsof -i -P -n | grep 4200`

Then `kill -9` that PID.

## Questions & Features

Please use the _Issues_ tab above to file new feature requests and hosting questions. Documentation can always be improved and it would be great to get your feedback. _Pull requests_ are also welcome.
