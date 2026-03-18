#!/usr/bin/env bash
# Runs Lighthouse CLI for both mobile and desktop CWV.
# Usage: bash scripts/lighthouse_audit.sh <URL>
# Output: prints JSON summary to stdout; saves full reports to /tmp/

set -euo pipefail

URL="${1:?Usage: $0 <URL>}"
SLUG=$(echo "$URL" | sed 's|https\?://||;s|[^a-zA-Z0-9]|-|g' | cut -c1-50)
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
OUT_DIR="/tmp/lighthouse-${SLUG}-${TIMESTAMP}"
mkdir -p "$OUT_DIR"

# Check Lighthouse is installed
if ! command -v lighthouse &>/dev/null; then
  echo '{"error": "Lighthouse not installed. Run: npm install -g lighthouse", "fallback": "Use PageSpeed Insights at https://pagespeed.web.dev/analysis?url='"$URL"'"}'
  exit 1
fi

echo "Running Lighthouse for: $URL" >&2

run_lighthouse() {
  local form_factor="$1"
  local preset="$2"
  local out_file="$OUT_DIR/${form_factor}.json"

  lighthouse "$URL" \
    --form-factor="$form_factor" \
    --preset="$preset" \
    --output=json \
    --output-path="$out_file" \
    --chrome-flags="--headless --no-sandbox --disable-gpu" \
    --quiet \
    2>/dev/null || true

  echo "$out_file"
}

MOBILE_FILE=$(run_lighthouse "mobile" "perf")
DESKTOP_FILE=$(run_lighthouse "desktop" "desktop")

extract_scores() {
  local file="$1"
  local label="$2"
  if [[ ! -f "$file" ]]; then
    echo "{\"config\": \"$label\", \"error\": \"Lighthouse run failed\"}"
    return
  fi
  python3 - "$file" "$label" <<'EOF'
import json, sys

file, label = sys.argv[1], sys.argv[2]
with open(file) as f:
    data = json.load(f)

cats = data.get("categories", {})
audits = data.get("audits", {})

def score(key):
    v = audits.get(key, {}).get("numericValue")
    return round(v / 1000, 2) if v and key != "cumulative-layout-shift" else (round(v, 3) if v else None)

def rating(metric, val):
    thresholds = {
        "lcp": (2.5, 4.0),
        "inp": (0.2, 0.5),
        "cls": (0.1, 0.25),
        "fcp": (1.8, 3.0),
        "ttfb": (0.8, 1.8),
    }
    t = thresholds.get(metric)
    if t is None or val is None:
        return "unknown"
    return "good" if val <= t[0] else ("needs-improvement" if val <= t[1] else "poor")

lcp = score("largest-contentful-paint")
fcp = score("first-contentful-paint")
ttfb = score("server-response-time")
cls_raw = audits.get("cumulative-layout-shift", {}).get("numericValue")
cls = round(cls_raw, 3) if cls_raw is not None else None
inp_raw = audits.get("interaction-to-next-paint", {}).get("numericValue")
inp = round(inp_raw / 1000, 3) if inp_raw else None

result = {
    "config": label,
    "performance_score": round((cats.get("performance", {}).get("score") or 0) * 100),
    "lcp_s": lcp, "lcp_rating": rating("lcp", lcp),
    "inp_s": inp, "inp_rating": rating("inp", inp),
    "cls": cls, "cls_rating": rating("cls", cls),
    "fcp_s": fcp, "fcp_rating": rating("fcp", fcp),
    "ttfb_s": ttfb, "ttfb_rating": rating("ttfb", ttfb),
    "report_path": file,
}
print(json.dumps(result, indent=2))
EOF
}

echo ""
echo "=== MOBILE ==="
extract_scores "$MOBILE_FILE" "mobile"

echo ""
echo "=== DESKTOP ==="
extract_scores "$DESKTOP_FILE" "desktop"

echo "" >&2
echo "Full reports saved to: $OUT_DIR" >&2
