#!/bin/bash
# The archive is built unsigned (Apple signs it for the App Store at export, see ios-testflight.yml).
# An unsigned build carries no entitlements, so the App Group that the app and the EZYOURLIFE keyboard
# share would be lost. This signs the archived app and keyboard "to run locally" with their entitlements
# files; the export then re-signs them for the App Store and keeps those entitlements.
set -euo pipefail
archive="$1"
here="$(cd "$(dirname "$0")" && pwd)"
app="$archive/Products/Applications/App.app"
appex="$app/PlugIns/Keyboard.appex"
[ -d "$appex" ] || { echo "::error::Keyboard.appex missing from the archive"; exit 1; }
codesign --force --sign - --timestamp=none --entitlements "$here/App/Keyboard/Keyboard.entitlements" "$appex"
codesign --force --sign - --timestamp=none --entitlements "$here/App/App/App.entitlements" "$app"
codesign -d --entitlements - "$app" 2>/dev/null | grep -q "group.com.ezyourlife.app" || { echo "::error::App Group missing on the app"; exit 1; }
codesign -d --entitlements - "$appex" 2>/dev/null | grep -q "group.com.ezyourlife.app" || { echo "::error::App Group missing on the keyboard"; exit 1; }
echo "App Group stamped on the app and the keyboard."
