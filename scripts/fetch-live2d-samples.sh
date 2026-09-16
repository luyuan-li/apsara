#!/usr/bin/env bash
# Fetch Live2D Cubism official Free Material samples into public/ + assets/.
# License: Live2D Free Material License (NOT MIT) — see Live2D Cubism Sample Data terms.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MODELS=("Mao" "Hiyori" "Haru" "Rice" "Wanko")
DEST_BASE="$ROOT/apps/desktop/public/pets/live2d"
ASSETS_BASE="$ROOT/assets/pets/live2d"
mkdir -p "$DEST_BASE" "$ASSETS_BASE"

need=()
for m in "${MODELS[@]}"; do
  id="$(echo "$m" | tr '[:upper:]' '[:lower:]')"
  if [[ -f "$DEST_BASE/$id/$m.model3.json" ]]; then
    echo "skip $m (already at $DEST_BASE/$id)"
  else
    need+=("$m")
  fi
done

if [[ ${#need[@]} -gt 0 ]]; then
  TMP=$(mktemp -d)
  trap 'rm -rf "$TMP"' EXIT
  git clone --depth 1 --filter=blob:none --sparse https://github.com/Live2D/CubismWebSamples.git "$TMP/repo"
  sparse=()
  for m in "${need[@]}"; do sparse+=("Samples/Resources/$m"); done
  git -C "$TMP/repo" sparse-checkout set "${sparse[@]}"

  for m in "${need[@]}"; do
    id="$(echo "$m" | tr '[:upper:]' '[:lower:]')"
    src="$TMP/repo/Samples/Resources/$m"
    rm -rf "$DEST_BASE/$id" "$ASSETS_BASE/$id"
    cp -R "$src" "$DEST_BASE/$id"
    cp -R "$src" "$ASSETS_BASE/$id"
    echo "Installed $m (Free Material License) → $DEST_BASE/$id"
  done
else
  echo "All Live2D samples present."
fi

# Soften older samples for Cubism4 runtime (always)
"$ROOT/scripts/patch-live2d-samples.sh"
