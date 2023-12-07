# Tier List Discord Bot

Tier List bot

Originally based on https://github.com/vercel/nextjs-discord-bot/tree/main

## Features
- Keeping rules up to date
- Voice Channel rename for countdown update
- Vote Command
- Turnorder Command
- Show Command
- List Command

## Local Setup
1. Version Control: Install [git](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) and [clone](https://docs.github.com/en/repositories/creating-and-managing-repositories/cloning-a-repository) this repository.
2. Node Version Manager (nvm): Allows you to quickly install and use different versions of node via the command line. Recommended by [Node Package Manager (npm)](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm): 
    - https://github.com/nvm-sh/nvm#installing-and-updating
        - Download Node Version Manager
    - https://github.com/nvm-sh/nvm#usage
        - Use Node Version Manager to download the latest release of node. [Node.js](https://nodejs.org/en/docs/guides/getting-started-guide) comes with npm by default.
3. [Node Package Manager (npm)](https://docs.npmjs.com/about-the-public-npm-registry): Navigate to the root directory of this project and install the necessary packages:
    ```
    npm install
    ```
4. Development Environment: Download and Install [Visual Studio Code](https://code.visualstudio.com/Download) and the [Phind VSCode Plugin.](https://marketplace.visualstudio.com/items?itemName=phind.phind)
5. Discord Configurations: Follow steps to [create an app in discord](https://discord.com/developers/docs/getting-started#step-1-creating-an-app)
    - The Discord token will be DISCORD_BOT_TOKEN in the .env file
    - The Account ID will be the DISCORD_CLIENT_ID in the .env file
    - [Enable Developer Mode](https://helpdeskgeek.com/how-to/how-to-enable-and-use-developer-mode-on-discord/) in discord to see userIDs, etc.
6. Bot Configurations: Create an SBIGMovies.json, cache.json, and turnOrder.json with just an empty JSON Array like below:
    ```
    {[]}
    ```
7. OMDB API: [Request an OMDB API key](https://www.omdbapi.com/apikey.aspx), it will be OMDB_ACCESS_TOKEN in the .env


## Helpful Links
- [Discord JS Guide](https://discordjs.guide/#before-you-begin)
    - [Embeds](https://discordjs.guide/popular-topics/embeds.html#using-the-embedbuilder)
    - [Buttons](https://discordjs.guide/message-components/buttons.html#building-buttons)
    - [Modals](https://discordjs.guide/interactions/modals.html)
- [OMDB API](https://www.omdbapi.com/)
- [Visual Studio Code NodeJS Tutorial](https://code.visualstudio.com/docs/nodejs/nodejs-tutorial)
- [Sequalize](https://sequelize.org/docs/v6/category/core-concepts/)
- [Rasperry Pi](https://www.raspberrypi.com/products/raspberry-pi-3-model-b/)
    - [Getting Started - OS Install](https://www.raspberrypi.com/documentation/computers/getting-started.html#install-an-operating-system)
    - [Postgres on Rasperry Pi](https://pimylifeup.com/raspberry-pi-postgresql/)
        - [Remote Access](https://tecadmin.net/postgresql-allow-remote-connections/)
    - [Prometheus](https://prometheus.io/docs/prometheus/latest/getting_started/)
        - [Rasperry Pi Installation](https://pimylifeup.com/raspberry-pi-prometheus/)
            - NOTE: There is a newer prometheus version.
    - [Grafana](https://grafana.com/tutorials/install-grafana-on-raspberry-pi/#install-grafana)
        - [PromQL Queries](https://github.com/code-with-jov/sbig-bot/blob/main/Docs/PromQL.md)
