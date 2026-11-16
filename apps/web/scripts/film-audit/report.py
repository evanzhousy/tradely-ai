"""Prints one film-audit page result (a JSON line on stdin) as short lines.

    report.py scan|flight|timing|play LABEL [rows]
    report.py scan LABEL TEXTFILE STAMP    also writes the capture's on-screen text list

An empty result is a failure of the run, not a clean result: it prints NO OUTPUT. A config with
nothing to report ends its line with "clean", which `film-audit.sh check` leaves out.
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


def stage_text(d, title):
    """The capture's text, one line a run: the frames a text stands in, then what it says.

    A run is a text unchanged over consecutive frames. Faint frames at a run's ends are its
    fade and are left out; a text held faint for 1.5 s or more is marked dim. A figure that
    changes every frame is one line, first value to last. Texts on one baseline that stand
    for the same frames read as one row, left to right.
    """
    times, frames = d["times"], d["text"]
    by_id = {}
    for k, items in enumerate(frames):
        for i, said, bright, x, y in items:
            by_id.setdefault(i, {})[k] = (said, bright, x, y)
    runs = []
    for seen in by_id.values():
        mine, run = [], None
        for k in sorted(seen):
            said, bright, x, y = seen[k]
            if run and run["to"] == k - 1 and run["said"] == said:
                run["to"] = k
                run["bright"].append(bright)
            else:
                run = {"from": k, "to": k, "said": said, "bright": [bright], "x": x, "y": y}
                mine.append(run)
        # A counter: two or more one-frame runs in a row become one line.
        merged, i = [], 0
        while i < len(mine):
            j = i
            while (j + 1 < len(mine) and mine[j]["from"] == mine[j]["to"]
                   and mine[j + 1]["from"] == mine[j]["to"] + 1):
                j += 1
            if j - i >= 2:
                first, last = mine[i], mine[j]
                if last["to"] > last["from"]:  # the value it settles on keeps its own line
                    j -= 1
                    last = mine[j]
                merged.append({**first, "to": last["to"],
                               "said": f"{first['said']} … {last['said']} (changing)",
                               "bright": [b for r in mine[i:j + 1] for b in r["bright"]]})
                i = j + 1
            else:
                merged.append(mine[i])
                i += 1
        runs += merged
    rows = []
    for r in runs:
        b = r["bright"]
        lead = next((n for n, v in enumerate(b) if v), len(b))
        tail = next((n for n, v in enumerate(reversed(b)) if v), len(b))
        note = ""
        if lead == len(b):  # never at full strength
            if len(b) < 3:
                continue
            note = " (dim)"
        else:
            start = r["from"] + (lead if lead <= 2 else 0)
            end = r["to"] - (tail if tail <= 2 else 0)
            dims, n = [], start
            while n <= end:
                if not b[n - r["from"]]:
                    m = n
                    while m + 1 <= end and not b[m + 1 - r["from"]]:
                        m += 1
                    if m - n >= 2:
                        dims.append(f"{n}-{m}")
                    n = m
                n += 1
            if dims:
                note = f" (dim in frames {', '.join(dims)})"
            r = {**r, "from": start, "to": end}
        rows.append((r["from"], r["to"], note, r["y"], r["x"], r["said"]))
    rows.sort(key=lambda r: (r[0], r[3], r[4]))
    lines, used = [], set()
    for n, (a, z, note, y, x, said) in enumerate(rows):
        if n in used:
            continue
        row = [(x, said)]
        for m in range(n + 1, len(rows)):
            a2, z2, note2, y2, x2, said2 = rows[m]
            if a2 != a:
                break
            if m not in used and (z2, note2) == (z, note) and abs(y2 - y) <= 4:
                used.add(m)
                row.append((x2, said2))
        span = f"frame {a}" if a == z else f"frames {a}-{z}"
        when = f"{times[a]:g}" if a == z else f"{times[a]:g}-{times[z]:g}"
        lines.append(f"{span} ({when} s){note}: "
                     + " | ".join(s for _, s in sorted(row)))
    return "\n".join([title, *lines]) + "\n"


if kind == "scan":
    if len(sys.argv) > 3 and d.get("text"):
        stamp = sys.argv[4] if len(sys.argv) > 4 else ""
        with open(sys.argv[3], "w") as f:
            f.write(stage_text(d, f"ON-SCREEN TEXT, {label} ({stamp}). Frame k is at k x 0.5 s."))
    o, c, e = grouped(d["overlaps"]), grouped(d.get("crossings", [])), grouped(d.get("edges", []))
    clean = not (d["errors"] or d["spills"] or o or c or e)
    print("%s dur=%s errors=%s spills=%s overlaps=%d crossings=%d edges=%d%s"
          % (label, d["duration"], d["errors"], d["spills"], len(o), len(c), len(e), " clean" if clean else ""))
    for tag, items in (("overlap", o), ("cross", c), ("edge", e)):
        for name, ts in items:
            print(f"    {tag} {name} @ {ts[0]} .. {ts[-1]} ({len(ts)})")
elif kind == "flight":
    print(f"{label} flight hits={len(d)}{'' if d else ' clean'}")
    for name, ts in sorted(d.items(), key=lambda kv: kv[1][0]):
        print(f"    {name} @ {ts[0]} .. {ts[-1]} ({len(ts)})")
elif kind == "timing":
    hero = d.get("heroLock")
    pct = f"{hero / d['runtime'] * 100:.1f}%" if hero is not None else "-"
    clean = not (d["fails"] or d.get("warnings"))
    print(f"{label} timing runtime={d['runtime']:.1f} hero={pct} fails={len(d['fails'])}{' clean' if clean else ''}")
    for f in d["fails"]:
        print(f"    fail {f}")
    for w in d.get("warnings", []):
        print(f"    warn {w}")
    if rows:
        for r in d["rows"]:
            print(f"     {r}")
        for p in d.get("pairs", []):
            print(f"    pair {p}")
