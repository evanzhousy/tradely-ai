# S4E07 storyboard

1. **01 · Two ledgers** — Keep the two ledgers separate — Session flow records what traded. Standing structure records reported context. They can inform one read without becoming one fact. — visual: `s4e07-ledgers`
2. **02 · Tape** — Today's tape is session-bounded — Prints, volume, side, and timing describe the selected session; they do not reveal a complete position ledger. — visual: `s4e07-tape`
3. **03 · Open interest** — Open interest is a reported horizon — OI is reported after the session and remains a snapshot, not a live inventory of who is positioned. — visual: `s4e07-oi`
4. **04 · Delta-OI** — Use delta-OI as change between snapshots — Compare two reported snapshots, preserve the sign and interval, and avoid turning the change into a verdict. — visual: `s4e07-delta`
5. **05 · GEX** — GEX is modeled structure context — A selected-date, expiry-scoped model can frame a map; it does not forecast the next print or reveal dealer intent. — visual: `s4e07-gex`
6. **06 · Freshness** — Write the freshness line — Session, as-of timestamp, expiry scope, source lens, and selected date make the two horizons auditable. — visual: `s4e07-freshness`
7. **07 · Handoff** — Compare horizons without collapsing them — Record what each ledger supports, what remains unknown, and which next check belongs to which horizon. — visual: `s4e07-handoff`
8. **08 · Practice** — Compare DEX, DEI, and GEX — Next: S4E08 · compare directional impact, normalized magnitude, and modeled structure without collapsing horizons. — visual: `s4e07-outro`
