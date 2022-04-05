#! /usr/bin/env bash

set -euo pipefail

export GCLOUD_PROJECT='okc-jail-botter-processor'

URL="okcjailblotterprocessor.azurecr.io/okc-jail-blotter-processor"
SHA="$(git rev-list -1 HEAD -- .)"
docker build . -t "$URL:$SHA"
docker push "$URL:$SHA"
