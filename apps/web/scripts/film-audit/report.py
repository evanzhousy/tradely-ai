"""Prints one film-audit page result (a JSON line on stdin) as short lines.

    report.py scan|flight|timing|play LABEL [rows]

An empty result is a failure of the run, not a clean result: it prints NO OUTPUT.
"""
import json
import sys

kind, label = sys.argv[1], sys.argv[2]
rows = len(sys.argv) > 3 and sys.argv[3] == "rows"
raw = sys.stdin.read().strip()
if not raw:
    print(f"{label} {kind}: NO OUTPUT")
    sys.exit(0)

if kind == "play":
    seen = set()
    for line in raw.splitlines():
        d = json.loads(line)
        if d["lesson"] in seen:
            continue
        seen.add(d["lesson"])
        print(
            "%-26s rate=%s play=%ss dur=%s speed=%s stalls=%s frames p95=%sms long=%s playground=%s errors=%s %s"
            % (d["lesson"], d.get("rate"), d.get("playSeconds"), d.get("duration"), d.get("speed"), d.get("stallsAt"),
               d.get("p95"), d.get("longFrames"), d.get("playground"), d.get("errors"), d.get("fail", ""))
        )
    sys.exit(0)

d = json.loads(raw.splitlines()[0])


def grouped(pairs):
    out = {}
    for t, names in pairs:
        for name in names:
            out.setdefault(name, []).append(t)
    return sorted(out.items(), key=lambda kv: kv[1][0])


if kind == "scan":
    o, c, e = grouped(d["overlaps"]), grouped(d.get("crossings", [])), grouped(d.get("edges", []))
    print("%s dur=%s errors=%s spills=%s overlaps=%d crossings=%d edges=%d"
          % (label, d["duration"], d["errors"], d["spills"], len(o), len(c), len(e)))
    for tag, items in (("overlap", o), ("cross", c), ("edge", e)):
        for name, ts in items:
            print(f"    {tag} {name} @ {ts[0]} .. {ts[-1]} ({len(ts)})")
elif kind == "flight":
    print(f"{label} flight hits={len(d)}")
    for name, ts in sorted(d.items(), key=lambda kv: kv[1][0]):
        print(f"    fly {name} @ {ts[0]} .. {ts[-1]} ({len(ts)})")
elif kind == "timing":
    hero = d.get("heroLock")
    pct = f"{hero / d['runtime'] * 100:.1f}%" if hero is not None else "-"
    print(f"{label} timing runtime={d['runtime']:.1f} hero={pct} fails={len(d['fails'])}")
    for f in d["fails"]:
        print(f"    fail {f}")
    for w in d.get("warnings", []):
        print(f"    warn {w}")
    if rows:
        for r in d["rows"]:
            print(f"     {r}")
