# omnia_lighting_app

This is a simple demo Application showcasing how to make use of the Omnia Network to discover light devices in environments and control them.
It's designed for the [Internet Computer](https://internetcomputer.org/) and makes use of its [HTTPS Outcalls](https://internetcomputer.org/https-outcalls/) to query devices and send commands to them.
For this reason, some knowledge of the Internet Computer is required to understand the code and how it works.

## Running the project locally

If you want to test your project locally, first you have to create a `.env` file in the root directory of the project. Follow the `.env.example` file to see which variables you have to set.
Then you can run the following commands:

```bash
# Starts the replica, running in the background
dfx start --background

# Deploys your canisters to the replica and generates your candid interface
npm run deploy
```
If you want to deploy only the backend canister, you can run:
```bash
npm run deploy:backend
```

### Note on frontend

It was bootstrapped with [Vite.js](https://vitejs.dev/) and uses [React](https://reactjs.org/) as a framework. For UI components it uses [Chakra UI](https://chakra-ui.com/).
