#!/bin/bash

source .env

if [ "$OMNIA_BACKEND_CANISTER_ID" = "" ]; then
  echo "Please provide a valid OMNIA_BACKEND_CANISTER_ID in .env file."
  exit 1
fi

if [ "$1" = "--backend" ]; then

  echo "Deploying only BACKEND canisters..."

  dfx deploy omnia_lighting_app_backend --no-wallet --argument "(null, \"$OMNIA_BACKEND_CANISTER_ID\")"
else
  echo "Deploying ALL canisters..."

  dfx deploy --no-wallet --argument "(null, \"$OMNIA_BACKEND_CANISTER_ID\")"
fi
