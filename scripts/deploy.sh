#!/bin/bash

source .env

if [ "$RDF_DATABASE_QUERY_URL" = "" ]; then
  echo "Please provide an RDF database query URL"
  exit 1
fi

if [ "$1" = "--backend" ]; then

  echo "Deploying only BACKEND canisters..."

  dfx deploy omnia_lighting_app_backend --no-wallet --argument "(\"$RDF_DATABASE_QUERY_URL\")"
else
  echo "Deploying ALL canisters..."

  dfx deploy --network https://5c86-129-132-41-122.ngrok-free.app --no-wallet --argument "(\"$RDF_DATABASE_QUERY_URL\")"
fi
