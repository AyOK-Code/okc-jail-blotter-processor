#! /usr/bin/env bash

set -euo pipefail

if ! ls "$OKC_JAIL_BLOTTER_PROCESSOR_CREDENTIALS" &> /dev/null; then
  echo "Could not find your GCloud credentials file. Check your OKC_JAIL_BLOTTER_PROCESSOR_CREDENTIALS variable: $OKC_JAIL_BLOTTER_PROCESSOR_CREDENTIALS"
  return 1
fi

export GOOGLE_APPLICATION_CREDENTIALS="$OKC_JAIL_BLOTTER_PROCESSOR_CREDENTIALS"
export GCLOUD_PROJECT='okc-jail-botter-processor'

if which greadlink &> /dev/null; then
  export PROJECT_DIR="$(dirname "${BASH_SOURCE[0]}" | xargs greadlink -f)"
else
  export PROJECT_DIR="$(dirname "${BASH_SOURCE[0]}" | xargs readlink -f)"
fi

gcloud auth activate-service-account --key-file=$GOOGLE_APPLICATION_CREDENTIALS
gcloud config set project $GCLOUD_PROJECT
gcloud config set run/region us-central1

gcloud auth configure-docker --quiet

URL="us.gcr.io/$GCLOUD_PROJECT/jail-blotter-processor"
SHA="$(git rev-list -1 HEAD -- .)"
docker build . -t "$URL:$SHA"
docker push "$URL:$SHA"
