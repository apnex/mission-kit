| Authority | Sole work |
|---|---|
| Proposer | Author questions, interpretations, tensions, mappings and composite intent. |
| Bound Director | Supply picks and rationale, return or clarify a candidate, abort, and ratify exact reviewed bytes. |
| Deterministic substrate | Validate shape, hash, freeze, persist, replay, normalize declared picks, project and render. |
| Mechanical validator | Produce pass/fail evidence; never decide semantic correctness. |
| Runtime host | Supply actor context, one writer lease, and explicit dependency bindings. |

Require the Director actor reference to equal the session’s `directorRef` for
every pick, walkthrough acknowledgement, return, withholding withdrawal and
ratification. Treat that equality as host provenance unless an embedding host
also supplies authenticated identity evidence.

Never let this package authorize a canonical cutover or a live Director
canary. Those remain external decisions.
