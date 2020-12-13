![Mixery social image](https://repository-images.githubusercontent.com/297007305/08d88a00-0bbf-11eb-8242-db9749473e69 "Mixery")

# Mixery
An open source Digital Audio Workspace. Mixery uses Web Audio API to render audio in realtime, as well as rendering it to audio file.

## Try Mixery
You can either try Mixery now by clicking [here](https://nahkd123.github.io/Mixery/app)

Other ways to try Mixery:
- [GitHub Pages](https://nahkd123.github.io/Mixery/app)
- [Heroku app (slow server start time)](https://mixery-web.herokuapp.com/)
- Mixery Electron [(source code)](https://github.com/nahkd123/Mixery-Electron) [(releases)](https://github.com/nahkd123/Mixery-Electron/releases)
- Build and host it yourself (see below)

## How to build? (starting from 11/08/2020)
0. Install [NodeJS](https://nodejs.org/en/) and npm. For Windows users, npm is already included in NodeJS installer. For Linux users, you'll need to install it via package manager (For Debian based, it's ``sudo apt install npm``)
1. Clone this repository: ``git clone https://github.com/nahkd123/Mixery.git``
2. Run ``npm run general.productionbuild`` for production build. It will also install missing packages.
> If it doesn't work, try ``npm run general.clean`` first (if it doesn't work for Windows, try ``npm run general.cleanWindows`` instead)
3. Start a HTTP server at ``./temp/production``

> You can also use ``npx tsc --watch`` while editing source codes so it will automagically compile files.

## Source Code License
The entire source code licensed under GPL v3.0. More information can be found in [here](https://www.gnu.org/licenses/gpl-3.0.html) or view in ``LICENSE`` file.
