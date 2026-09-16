#!/usr/bin/env bash
# Post-process fetched Free Material samples for our Cubism4 runtime.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
WANKO="$ROOT/apps/desktop/public/pets/live2d/wanko/Wanko.model3.json"
if [[ -f "$WANKO" ]]; then
  python3 - "$WANKO" <<'PY'
import json, sys
from pathlib import Path
p = Path(sys.argv[1])
d = json.loads(p.read_text())
# Old PARAM_* eye/lip groups can break Cubism4 eyeBlink setup → blank stage
d["Groups"] = []
p.write_text(json.dumps(d, indent=2, ensure_ascii=False) + "\n")
root = p.parents[4]  # .../apsara
ap = root / "assets/pets/live2d/wanko/Wanko.model3.json"
if ap.parent.exists():
    ap.write_text(p.read_text())
print("patched Wanko groups →", p)
PY
fi
