#!/usr/bin/env bash
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"
PORT="${1:-8099}"
echo "Serving alienpls3 at http://localhost:${PORT}/"
echo "Press Ctrl+C to stop."
python3 -m http.server "${PORT}" --directory "${DIR}"
