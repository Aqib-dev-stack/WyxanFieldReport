#!/usr/bin/env bash
# Copies the app's SQLite database from a connected Android device to
# ./.local-db/ so it can be inspected on the computer.
#
#   npm run db:pull                     # one device connected
#   ANDROID_SERIAL=<id> npm run db:pull # several devices (see `adb devices`)
#
# Works on debug builds only (`run-as` needs a debuggable app). The -wal file
# is copied too: recent writes may still be there, not yet in the main file.
set -euo pipefail

PACKAGE="com.wyxanfieldreport"
DB="wyxan.db"
OUT=".local-db"

mkdir -p "$OUT"
rm -f "$OUT/$DB" "$OUT/$DB-wal" "$OUT/$DB-shm"

files="$(adb shell "run-as $PACKAGE ls databases" | tr -d '\r')"
if ! grep -qx "$DB" <<<"$files"; then
  echo "No $DB on the device yet. Open the app once, then try again." >&2
  exit 1
fi

for file in "$DB" "$DB-wal" "$DB-shm"; do
  if grep -qx "$file" <<<"$files"; then
    adb exec-out "run-as $PACKAGE cat databases/$file" >"$OUT/$file"
  fi
done

echo "Copied to $OUT/$DB"
echo "Inspect:  sqlite3 $OUT/$DB '.tables'"
echo "      or  open it in DB Browser for SQLite (https://sqlitebrowser.org)"
