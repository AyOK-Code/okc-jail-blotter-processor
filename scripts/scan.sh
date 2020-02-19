#! /usr/bin/env bash

set -euo pipefail

if type gawk &> /dev/null; then
  AWK_COMMAND='gawk'
elif awk --version | grep -i 'GNU Awk' &> /dev/null; then
  AWK_COMMAND='awk'
else
  echo 'This script requires GNU Awk to be installed'
  exit 1
fi

is-blotter-pdf() {
  printf '%s' "$1" | "$AWK_COMMAND" -v "FS=: " '
    BEGIN { status = 2 }
    $1 == "content-type" && $2 == "application/pdf\r" { status-- }
    $1 == "content-disposition" && match($2, /filename="([A-Z][a-z]+[0-9]{5,6}[.]pdf)"\r/, capture) { status--; print capture[1] }
    $1 == "content-keywords" { status++ }
    END { exit status }'
}

for i in $(seq 16246 16000); do
  URL="https://www.okc.gov/Home/ShowDocument?id=$i"
  printf 'HEAD %s\n' "$URL"
  HEADERS="$(curl -s -I "$URL")"

  if BLOTTER="$(is-blotter-pdf "$HEADERS")"; then
    TARGET="pdf/$BLOTTER"
    if ! [ -f "$TARGET" ]; then
      printf 'Downloading %s to %s\n' "$i" "$TARGET"
      sleep 1
      curl -s "$URL" -o "$TARGET"
    else
      printf 'ERROR: %s already exists\n' "$TARGET"
    fi
  fi

  sleep 0.25
done
