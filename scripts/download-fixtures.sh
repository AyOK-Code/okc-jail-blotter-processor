#! /usr/bin/env bash

set -euo pipefail

ALL_IDS=(
  16884
  16617
  16386
  16300
  16294
  16292
  16290
  16286
  16266
  16264
  16246
  16240
  16238
  16236
  16228
  16224
  16214
  16202
  16192
  16196
  16194
  16188
  16182
  16174
  16148
  16132
  16130
  16128
  16120
  16116
  16110
  16106
  16094
  16092
  16090
  16072
  16068
  16052
  16036
  16034
  16032
  16030
  16028
  15976
  15970
  15962
  15950
  15948
  15946
  15936
  15934
  15928
  15908
  15898
  15896
  15894
  15878
  15874
  15872
)
ALL_NAMES=(
  April242020.pdf
  April32020.pdf
  March132020.pdf
  February252020.pdf
  February242020.pdf
  February232020.pdf
  February222020.pdf
  February212020.pdf
  February202020.pdf
  February192020.pdf
  February182020.pdf
  February172020.pdf
  February162020.pdf
  February152020.pdf
  February142020.pdf
  February132020.pdf
  February122020.pdf
  February112020.pdf
  February102020.pdf
  February92020.pdf
  February82020.pdf
  February72020.pdf
  February62020.pdf
  February52020.pdf
  February42020.pdf
  February32020.pdf
  February22020.pdf
  February12020.pdf
  January312020.pdf
  January302020.pdf
  January292020.pdf
  January282020.pdf
  January272020.pdf
  January262020.pdf
  January252020.pdf
  January242020.pdf
  January232020.pdf
  January222020.pdf
  January212020.pdf
  January202020.pdf
  January192020.pdf
  January182020.pdf
  January172020.pdf
  January162020.pdf
  January152020.pdf
  January142020.pdf
  January132020.pdf
  January122020.pdf
  January112020.pdf
  January102020.pdf
  January92020.pdf
  January82020.pdf
  January72020.pdf
  January62020.pdf
  January52020.pdf
  January42020.pdf
  January32020.pdf
  January22020.pdf
  January12020.pdf
)

OPTION="${1:-}"
if [ "$OPTION" = "all" ]; then
  echo "Downloading Jan 1, 2020 - Feb 20, 2020"
  IDS=( ${ALL_IDS[@]} )
  NAMES=( ${ALL_NAMES[@]} )
elif [ "$OPTION" = "random" ]; then
  IDS=( )
  NAMES=( )
  N=5
  for i in $(seq 1 "$N"); do
    SELECTED="$(( "$RANDOM" % "${#ALL_IDS[@]}" ))"
    IDS+=( "${ALL_IDS[$SELECTED]}" )
    NAMES+=( "${ALL_NAMES[$SELECTED]}" )
  done
  echo "Downloading $N random PDFs"
else
  IDS=( "${ALL_IDS[19]}" "${ALL_IDS[34]}" "${ALL_IDS[33]}" "${ALL_IDS[44]}" )
  NAMES=( "${ALL_NAMES[19]}" "${ALL_NAMES[34]}" "${ALL_NAMES[33]}" "${ALL_NAMES[44]}" )
fi

for i in $(seq 0 "$(( "${#IDS[@]}" - 1 ))"); do
  URL="https://www.okc.gov/Home/ShowDocument?id=${IDS[$i]}"
  TARGET="test/fixtures/${NAMES[$i]}"
  PROGRESS="$(( "$i" + 1 ))/${#IDS[@]}"
  if ! [ -f "$TARGET" ]; then
    echo "$PROGRESS Downloading $URL to $TARGET"
    curl -s "$URL" -o "$TARGET"
    sleep 1
  else
    echo "$PROGRESS $TARGET is already present, skipping."
  fi
done

echo "Done"
