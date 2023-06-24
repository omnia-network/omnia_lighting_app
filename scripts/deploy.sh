#!/bin/bash

source .env

if [ "$OMNIA_BACKEND_CANISTER_ID" = "" ]; then
  echo "Please provide a valid OMNIA_BACKEND_CANISTER_ID in .env file."
  exit 1
fi

if [ "$1" = "--backend" ]; then

  echo "Deploying only BACKEND canisters..."

  # the null as first argument is needed to deploy the Internet Identity canister
  dfx deploy omnia_lighting_app_backend --no-wallet --argument "(null, opt \"$OMNIA_BACKEND_CANISTER_ID\", opt \"$LEDGER_CANISTER_ID\")"
  # to reset the canister:
  # dfx canister install --argument "(null, opt \"$OMNIA_BACKEND_CANISTER_ID\", opt \"$LEDGER_CANISTER_ID\")" --mode reinstall omnia_lighting_app_backend
else
  echo "Deploying ALL canisters..."

  # same as above for the null argument
  dfx deploy --no-wallet --argument "(null, opt \"$OMNIA_BACKEND_CANISTER_ID\", opt \"$LEDGER_CANISTER_ID\")"
  # to deploy to the IC:
  # dfx deploy --network ic --argument "(null, null, null)"
fi
