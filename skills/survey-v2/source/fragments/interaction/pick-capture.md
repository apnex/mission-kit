Preserve the Director’s response byte-for-byte. Normalize case and whitespace,
remove duplicate letters, and order selections by declared option order.
Accept one or more current-question option IDs only.

Accumulate composable picks. Preserve an exclusive multi-pick as a
contradictory-constraint record rather than rejecting or choosing for the
Director. For mixed questions, derive contradictions only from declared
incompatibility sets.

Make every accepted pick immediately immutable. Treat the same event ID and
payload as an idempotent replay; treat the same event ID with changed payload
as an integrity fault. Invalid or empty input records RJ01 and leaves state,
cursor, and current view unchanged.
