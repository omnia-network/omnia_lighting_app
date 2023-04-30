#!/bin/bash

source .env

if [ "$RDF_DATABASE_BASE_URL" = "" ]; then
  echo "Please provide an RDF database base URL"
  exit 1
fi

if [ "$1" = "--backend" ]; then

  echo "Deploying only BACKEND canisters..."

  dfx deploy omnia_lighting_app_backend --no-wallet --argument "(\"$RDF_DATABASE_BASE_URL\")"
else
  echo "Deploying ALL canisters..."

  dfx deploy --no-wallet --argument "(\"$RDF_DATABASE_BASE_URL\")"
fi
