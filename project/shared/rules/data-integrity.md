# Data Integrity

Represent data honestly — missing means missing, and no value is ever fabricated to fill a gap.

## Source of truth

- Derived values never replace or overwrite source values.
- When source and derived values both exist, preserve both and keep their relationship explicit.

## Missing values

- Missing or unknown values are a real null (`None` / `null` / `undefined`) — never an empty string,
  `"N/A"`, `"TBD"`, `"-"`, `0`, or any sentinel standing in for absence.
- Missing optional fields render or emit nothing — never a placeholder or stand-in label.
- Distinguish absent from empty from zero/false — never conflate them or coerce one into another.
- Presentation-layer placeholders may be shown to users when explicitly required, but the underlying
  data remains null.

## Fallbacks & defaults

- A fallback or derived default is allowed only when explicitly specified, and is recorded as such —
  never silently substituted.
- Never invent, guess, or interpolate a value (metric, date, id, label) the source does not provide.
  If it is unknown it stays null and is surfaced as missing.

## Boundaries & transforms

- Validate data at external boundaries (input, API, file, parse) — reject or surface malformed data,
  never silently coerce it into a plausible-looking value.
- Preserve identifiers exactly as provided — never normalize, reformat, trim, pad, or regenerate ids
  unless explicitly required.
- Preserve type and precision through transforms — do not stringify numbers, truncate precision, or
  drop timezone/encoding information in passing.
- Writes are non-destructive of unrelated data — never silently overwrite or drop fields out of scope.
