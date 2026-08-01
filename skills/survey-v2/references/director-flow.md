<!-- GENERATED FILE. Machine edges resolve to the canonical protocol manifest. -->

# Director FLOW

```mermaid
flowchart TB
    %% @flow-node|phase_new|phase-state|new
    phase_new[New]
    %% @flow-node|phase_initializing|phase-state|initializing
    phase_initializing[Initializing]
    %% @flow-node|phase_initialized|phase-state|initialized
    phase_initialized[Initialized]
    %% @flow-node|phase_round_1_drafting|phase-state|round_1_drafting
    phase_round_1_drafting[R1Drafting]
    %% @flow-node|phase_round_1_q1_ready|phase-state|round_1_q1_ready
    phase_round_1_q1_ready[R1Q1Ready]
    %% @flow-node|phase_round_1_q1_awaiting|phase-state|round_1_q1_awaiting
    phase_round_1_q1_awaiting[R1Q1Awaiting]
    %% @flow-node|phase_round_1_q2_ready|phase-state|round_1_q2_ready
    phase_round_1_q2_ready[R1Q2Ready]
    %% @flow-node|phase_round_1_q2_awaiting|phase-state|round_1_q2_awaiting
    phase_round_1_q2_awaiting[R1Q2Awaiting]
    %% @flow-node|phase_round_1_q3_ready|phase-state|round_1_q3_ready
    phase_round_1_q3_ready[R1Q3Ready]
    %% @flow-node|phase_round_1_q3_awaiting|phase-state|round_1_q3_awaiting
    phase_round_1_q3_awaiting[R1Q3Awaiting]
    %% @flow-node|phase_round_1_responses_complete|phase-state|round_1_responses_complete
    phase_round_1_responses_complete[R1ResponsesComplete]
    %% @flow-node|phase_round_1_interpreting|phase-state|round_1_interpreting
    phase_round_1_interpreting[R1Interpreting]
    %% @flow-node|phase_round_1_interpreted|phase-state|round_1_interpreted
    phase_round_1_interpreted[R1Interpreted]
    %% @flow-node|phase_round_2_drafting|phase-state|round_2_drafting
    phase_round_2_drafting[R2Drafting]
    %% @flow-node|phase_round_2_q4_ready|phase-state|round_2_q4_ready
    phase_round_2_q4_ready[R2Q4Ready]
    %% @flow-node|phase_round_2_q4_awaiting|phase-state|round_2_q4_awaiting
    phase_round_2_q4_awaiting[R2Q4Awaiting]
    %% @flow-node|phase_round_2_q5_ready|phase-state|round_2_q5_ready
    phase_round_2_q5_ready[R2Q5Ready]
    %% @flow-node|phase_round_2_q5_awaiting|phase-state|round_2_q5_awaiting
    phase_round_2_q5_awaiting[R2Q5Awaiting]
    %% @flow-node|phase_round_2_q6_ready|phase-state|round_2_q6_ready
    phase_round_2_q6_ready[R2Q6Ready]
    %% @flow-node|phase_round_2_q6_awaiting|phase-state|round_2_q6_awaiting
    phase_round_2_q6_awaiting[R2Q6Awaiting]
    %% @flow-node|phase_round_2_responses_complete|phase-state|round_2_responses_complete
    phase_round_2_responses_complete[R2ResponsesComplete]
    %% @flow-node|phase_round_2_interpreting|phase-state|round_2_interpreting
    phase_round_2_interpreting[R2Interpreting]
    %% @flow-node|phase_round_2_interpreted|phase-state|round_2_interpreted
    phase_round_2_interpreted[R2Interpreted]
    %% @flow-node|phase_composite_drafting|phase-state|composite_drafting
    phase_composite_drafting[CompositeDrafting]
    %% @flow-node|phase_composite_candidate|phase-state|composite_candidate
    phase_composite_candidate[CompositeCandidate]
    %% @flow-node|phase_walkthrough_ready|phase-state|walkthrough_ready
    phase_walkthrough_ready[WalkthroughReady]
    %% @flow-node|phase_walkthrough_in_progress|phase-state|walkthrough_in_progress
    phase_walkthrough_in_progress[WalkthroughInProgress]
    %% @flow-node|phase_awaiting_ratification|phase-state|awaiting_ratification
    phase_awaiting_ratification[AwaitingRatification]
    %% @flow-node|phase_revision_requested|phase-state|revision_requested
    phase_revision_requested[RevisionRequested]
    %% @flow-node|phase_ratified|phase-state|ratified
    phase_ratified[Ratified]
    %% @flow-node|phase_finalizing|phase-state|finalizing
    phase_finalizing[Finalizing]
    %% @flow-node|phase_intent_captured|phase-state|intent_captured
    phase_intent_captured[IntentCaptured]
    %% @flow-node|phase_aborted|phase-state|aborted
    phase_aborted[Aborted]
    %% @flow-node|phase_SG01|phase-selector|SG01
    phase_SG01{undefined}
    %% @flow-node|phase_SG02|phase-selector|SG02
    phase_SG02{undefined}
    %% @flow-node|runtime_rehydrating|runtime-state|rehydrating
    runtime_rehydrating[Rehydrating]
    %% @flow-node|runtime_active|runtime-state|active
    runtime_active[Active]
    %% @flow-node|runtime_suspended|runtime-state|suspended
    runtime_suspended[Suspended]
    %% @flow-node|runtime_blocked_recoverable|runtime-state|blocked_recoverable
    runtime_blocked_recoverable[BlockedRecoverable]
    %% @flow-node|runtime_blocked_terminal|runtime-state|blocked_terminal
    runtime_blocked_terminal[BlockedTerminal]
    %% @flow-node|runtime_closed|runtime-state|closed
    runtime_closed[Closed]
    %% @flow-node|runtime_SR01|runtime-selector|SR01
    runtime_SR01{undefined}
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDEiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJBQ0NFUFRfSU5JVElBTElaQVRJT04iLCJmcm9tIjoibmV3IiwiZ3VhcmQiOiJHMDEiLCJpZCI6IlQwMSIsIm11dGF0aW9uIjoiTTAxIiwidG8iOiJpbml0aWFsaXppbmcifQ
    phase_new -->|T01| phase_initializing
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDIiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9SMV9ERVNJR04iLCJmcm9tIjoiaW5pdGlhbGl6ZWQiLCJndWFyZCI6IkcwMiIsImlkIjoiVDAyIiwibXV0YXRpb24iOiJNMDIiLCJ0byI6InJvdW5kXzFfZHJhZnRpbmcifQ
    phase_initialized -->|T02| phase_round_1_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDMiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJGUkVFWkVfUjEiLCJmcm9tIjoicm91bmRfMV9kcmFmdGluZyIsImd1YXJkIjoiRzAzIiwiaWQiOiJUMDMiLCJtdXRhdGlvbiI6Ik0wMyIsInRvIjoicm91bmRfMV9xMV9yZWFkeSJ9
    phase_round_1_drafting -->|T03| phase_round_1_q1_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDQiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJSRU9QRU5fUjEiLCJmcm9tIjoicm91bmRfMV9xMV9yZWFkeSIsImd1YXJkIjoiRzA0IiwiaWQiOiJUMDQiLCJtdXRhdGlvbiI6Ik0wNCIsInRvIjoicm91bmRfMV9kcmFmdGluZyJ9
    phase_round_1_q1_ready -->|T04| phase_round_1_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDUiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1ExIiwiZnJvbSI6InJvdW5kXzFfcTFfcmVhZHkiLCJndWFyZCI6IkcwNSIsImlkIjoiVDA1IiwibXV0YXRpb24iOiJNMDUiLCJ0byI6InJvdW5kXzFfcTFfYXdhaXRpbmcifQ
    phase_round_1_q1_ready -->|T05| phase_round_1_q1_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDYiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1ExIiwiZnJvbSI6InJvdW5kXzFfcTFfYXdhaXRpbmciLCJndWFyZCI6IkcwNiIsImlkIjoiVDA2IiwibXV0YXRpb24iOiJNMDYiLCJ0byI6InJvdW5kXzFfcTJfcmVhZHkifQ
    phase_round_1_q1_awaiting -->|T06| phase_round_1_q2_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDciLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1EyIiwiZnJvbSI6InJvdW5kXzFfcTJfcmVhZHkiLCJndWFyZCI6IkcwNyIsImlkIjoiVDA3IiwibXV0YXRpb24iOiJNMDciLCJ0byI6InJvdW5kXzFfcTJfYXdhaXRpbmcifQ
    phase_round_1_q2_ready -->|T07| phase_round_1_q2_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDgiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1EyIiwiZnJvbSI6InJvdW5kXzFfcTJfYXdhaXRpbmciLCJndWFyZCI6IkcwOCIsImlkIjoiVDA4IiwibXV0YXRpb24iOiJNMDgiLCJ0byI6InJvdW5kXzFfcTNfcmVhZHkifQ
    phase_round_1_q2_awaiting -->|T08| phase_round_1_q3_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMDkiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1EzIiwiZnJvbSI6InJvdW5kXzFfcTNfcmVhZHkiLCJndWFyZCI6IkcwOSIsImlkIjoiVDA5IiwibXV0YXRpb24iOiJNMDkiLCJ0byI6InJvdW5kXzFfcTNfYXdhaXRpbmcifQ
    phase_round_1_q3_ready -->|T09| phase_round_1_q3_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTAiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1EzIiwiZnJvbSI6InJvdW5kXzFfcTNfYXdhaXRpbmciLCJndWFyZCI6IkcxMCIsImlkIjoiVDEwIiwibXV0YXRpb24iOiJNMTAiLCJ0byI6InJvdW5kXzFfcmVzcG9uc2VzX2NvbXBsZXRlIn0
    phase_round_1_q3_awaiting -->|T10| phase_round_1_responses_complete
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTEiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9SMV9JTlRFUlBSRVRBVElPTiIsImZyb20iOiJyb3VuZF8xX3Jlc3BvbnNlc19jb21wbGV0ZSIsImd1YXJkIjoiRzExIiwiaWQiOiJUMTEiLCJtdXRhdGlvbiI6Ik0xMSIsInRvIjoicm91bmRfMV9pbnRlcnByZXRpbmcifQ
    phase_round_1_responses_complete -->|T11| phase_round_1_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTIiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJDT01NSVRfUjFfSU5URVJQUkVUQVRJT04iLCJmcm9tIjoicm91bmRfMV9pbnRlcnByZXRpbmciLCJndWFyZCI6IkcxMiIsImlkIjoiVDEyIiwibXV0YXRpb24iOiJNMTIiLCJ0byI6InJvdW5kXzFfaW50ZXJwcmV0ZWQifQ
    phase_round_1_interpreting -->|T12| phase_round_1_interpreted
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTMiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9SMl9ERVNJR04iLCJmcm9tIjoicm91bmRfMV9pbnRlcnByZXRlZCIsImd1YXJkIjoiRzEzIiwiaWQiOiJUMTMiLCJtdXRhdGlvbiI6Ik0xMyIsInRvIjoicm91bmRfMl9kcmFmdGluZyJ9
    phase_round_1_interpreted -->|T13| phase_round_2_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTQiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJGUkVFWkVfUjIiLCJmcm9tIjoicm91bmRfMl9kcmFmdGluZyIsImd1YXJkIjoiRzE0IiwiaWQiOiJUMTQiLCJtdXRhdGlvbiI6Ik0xNCIsInRvIjoicm91bmRfMl9xNF9yZWFkeSJ9
    phase_round_2_drafting -->|T14| phase_round_2_q4_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTUiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJSRU9QRU5fUjIiLCJmcm9tIjoicm91bmRfMl9xNF9yZWFkeSIsImd1YXJkIjoiRzE1IiwiaWQiOiJUMTUiLCJtdXRhdGlvbiI6Ik0xNSIsInRvIjoicm91bmRfMl9kcmFmdGluZyJ9
    phase_round_2_q4_ready -->|T15| phase_round_2_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTYiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1E0IiwiZnJvbSI6InJvdW5kXzJfcTRfcmVhZHkiLCJndWFyZCI6IkcxNiIsImlkIjoiVDE2IiwibXV0YXRpb24iOiJNMTYiLCJ0byI6InJvdW5kXzJfcTRfYXdhaXRpbmcifQ
    phase_round_2_q4_ready -->|T16| phase_round_2_q4_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTciLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1E0IiwiZnJvbSI6InJvdW5kXzJfcTRfYXdhaXRpbmciLCJndWFyZCI6IkcxNyIsImlkIjoiVDE3IiwibXV0YXRpb24iOiJNMTciLCJ0byI6InJvdW5kXzJfcTVfcmVhZHkifQ
    phase_round_2_q4_awaiting -->|T17| phase_round_2_q5_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTgiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1E1IiwiZnJvbSI6InJvdW5kXzJfcTVfcmVhZHkiLCJndWFyZCI6IkcxOCIsImlkIjoiVDE4IiwibXV0YXRpb24iOiJNMTgiLCJ0byI6InJvdW5kXzJfcTVfYXdhaXRpbmcifQ
    phase_round_2_q5_ready -->|T18| phase_round_2_q5_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMTkiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1E1IiwiZnJvbSI6InJvdW5kXzJfcTVfYXdhaXRpbmciLCJndWFyZCI6IkcxOSIsImlkIjoiVDE5IiwibXV0YXRpb24iOiJNMTkiLCJ0byI6InJvdW5kXzJfcTZfcmVhZHkifQ
    phase_round_2_q5_awaiting -->|T19| phase_round_2_q6_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjAiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJQUkVTRU5UX1E2IiwiZnJvbSI6InJvdW5kXzJfcTZfcmVhZHkiLCJndWFyZCI6IkcyMCIsImlkIjoiVDIwIiwibXV0YXRpb24iOiJNMjAiLCJ0byI6InJvdW5kXzJfcTZfYXdhaXRpbmcifQ
    phase_round_2_q6_ready -->|T20| phase_round_2_q6_awaiting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjEiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJSRVNQT05EX1E2IiwiZnJvbSI6InJvdW5kXzJfcTZfYXdhaXRpbmciLCJndWFyZCI6IkcyMSIsImlkIjoiVDIxIiwibXV0YXRpb24iOiJNMjEiLCJ0byI6InJvdW5kXzJfcmVzcG9uc2VzX2NvbXBsZXRlIn0
    phase_round_2_q6_awaiting -->|T21| phase_round_2_responses_complete
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjIiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9SMl9JTlRFUlBSRVRBVElPTiIsImZyb20iOiJyb3VuZF8yX3Jlc3BvbnNlc19jb21wbGV0ZSIsImd1YXJkIjoiRzIyIiwiaWQiOiJUMjIiLCJtdXRhdGlvbiI6Ik0yMiIsInRvIjoicm91bmRfMl9pbnRlcnByZXRpbmcifQ
    phase_round_2_responses_complete -->|T22| phase_round_2_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjMiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJDT01NSVRfUjJfSU5URVJQUkVUQVRJT04iLCJmcm9tIjoicm91bmRfMl9pbnRlcnByZXRpbmciLCJndWFyZCI6IkcyMyIsImlkIjoiVDIzIiwibXV0YXRpb24iOiJNMjMiLCJ0byI6InJvdW5kXzJfaW50ZXJwcmV0ZWQifQ
    phase_round_2_interpreting -->|T23| phase_round_2_interpreted
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjQiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9DT01QT1NJVEUiLCJmcm9tIjoicm91bmRfMl9pbnRlcnByZXRlZCIsImd1YXJkIjoiRzI0IiwiaWQiOiJUMjQiLCJtdXRhdGlvbiI6Ik0yNCIsInRvIjoiY29tcG9zaXRlX2RyYWZ0aW5nIn0
    phase_round_2_interpreted -->|T24| phase_composite_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjUiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJDT01NSVRfQ0FORElEQVRFIiwiZnJvbSI6ImNvbXBvc2l0ZV9kcmFmdGluZyIsImd1YXJkIjoiRzI1IiwiaWQiOiJUMjUiLCJtdXRhdGlvbiI6Ik0yNSIsInRvIjoiY29tcG9zaXRlX2NhbmRpZGF0ZSJ9
    phase_composite_drafting -->|T25| phase_composite_candidate
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjYiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJDQU5ESURBVEVfVkFMSURBVElPTl9QQVNTIiwiZnJvbSI6ImNvbXBvc2l0ZV9jYW5kaWRhdGUiLCJndWFyZCI6IkcyNiIsImlkIjoiVDI2IiwibXV0YXRpb24iOiJNMjYiLCJ0byI6IndhbGt0aHJvdWdoX3JlYWR5In0
    phase_composite_candidate -->|T26| phase_walkthrough_ready
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjciLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJDQU5ESURBVEVfVkFMSURBVElPTl9GQUlMIiwiZnJvbSI6ImNvbXBvc2l0ZV9jYW5kaWRhdGUiLCJndWFyZCI6IkcyNyIsImlkIjoiVDI3IiwibXV0YXRpb24iOiJNMjciLCJ0byI6ImNvbXBvc2l0ZV9kcmFmdGluZyJ9
    phase_composite_candidate -->|T27| phase_composite_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjgiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJTVEFSVF9XQUxLVEhST1VHSCIsImZyb20iOiJ3YWxrdGhyb3VnaF9yZWFkeSIsImd1YXJkIjoiRzI4IiwiaWQiOiJUMjgiLCJtdXRhdGlvbiI6Ik0yOCIsInRvIjoid2Fsa3Rocm91Z2hfaW5fcHJvZ3Jlc3MifQ
    phase_walkthrough_ready -->|T28| phase_walkthrough_in_progress
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMjkiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJBQ0tfV0FMS1RIUk9VR0hfQURWQU5DRSIsImZyb20iOiJ3YWxrdGhyb3VnaF9pbl9wcm9ncmVzcyIsImd1YXJkIjoiRzI5IiwiaWQiOiJUMjkiLCJtdXRhdGlvbiI6Ik0yOSIsInRvIjoid2Fsa3Rocm91Z2hfaW5fcHJvZ3Jlc3MifQ
    phase_walkthrough_in_progress -->|T29| phase_walkthrough_in_progress
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzAiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJBQ0tfV0FMS1RIUk9VR0hfQ09NUExFVEUiLCJmcm9tIjoid2Fsa3Rocm91Z2hfaW5fcHJvZ3Jlc3MiLCJndWFyZCI6IkczMCIsImlkIjoiVDMwIiwibXV0YXRpb24iOiJNMzAiLCJ0byI6ImF3YWl0aW5nX3JhdGlmaWNhdGlvbiJ9
    phase_walkthrough_in_progress -->|T30| phase_awaiting_ratification
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzEiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJESVJFQ1RPUl9SQVRJRlkiLCJmcm9tIjoiYXdhaXRpbmdfcmF0aWZpY2F0aW9uIiwiZ3VhcmQiOiJHMzEiLCJpZCI6IlQzMSIsIm11dGF0aW9uIjoiTTMxIiwidG8iOiJyYXRpZmllZCJ9
    phase_awaiting_ratification -->|T31| phase_ratified
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzIiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJESVJFQ1RPUl9SRVRVUk4iLCJmcm9tIjoiYXdhaXRpbmdfcmF0aWZpY2F0aW9uIiwiZ3VhcmQiOiJHMzIiLCJpZCI6IlQzMiIsIm11dGF0aW9uIjoiTTMyIiwidG8iOiJyZXZpc2lvbl9yZXF1ZXN0ZWQifQ
    phase_awaiting_ratification -->|T32| phase_revision_requested
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzMiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9DT01QT1NJVEVfUkVWSVNJT04iLCJmcm9tIjoicmV2aXNpb25fcmVxdWVzdGVkIiwiZ3VhcmQiOiJHMzMiLCJpZCI6IlQzMyIsIm11dGF0aW9uIjoiTTMzIiwidG8iOiJjb21wb3NpdGVfZHJhZnRpbmcifQ
    phase_revision_requested -->|T33| phase_composite_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzQiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJCRUdJTl9GSU5BTElaQVRJT04iLCJmcm9tIjoicmF0aWZpZWQiLCJndWFyZCI6IkczNCIsImlkIjoiVDM0IiwibXV0YXRpb24iOiJNMzQiLCJ0byI6ImZpbmFsaXppbmcifQ
    phase_ratified -->|T34| phase_finalizing
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzUiLCJhdXRob3JpdHkiOiJBVTAzIiwiY291cGxlZFRyYW5zaXRpb24iOiJSVDEyIiwiZXZlbnQiOiJGSU5BTElaQVRJT05fUEFTUyIsImZyb20iOiJmaW5hbGl6aW5nIiwiZ3VhcmQiOiJHMzUiLCJpZCI6IlQzNSIsIm11dGF0aW9uIjoiTTM1IiwidG8iOiJpbnRlbnRfY2FwdHVyZWQifQ
    phase_finalizing -->|T35| phase_intent_captured
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzYiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJGSU5BTElaQVRJT05fUkVUUllBQkxFX0ZBSUwiLCJmcm9tIjoiZmluYWxpemluZyIsImd1YXJkIjoiRzM2IiwiaWQiOiJUMzYiLCJtdXRhdGlvbiI6Ik0zNiIsInRvIjoiZmluYWxpemluZyJ9
    phase_finalizing -->|T36| phase_finalizing
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzciLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJCRUdJTl9SMl9SRUlOVEVSUFJFVEFUSU9OIiwiZnJvbSI6InJldmlzaW9uX3JlcXVlc3RlZCIsImd1YXJkIjoiRzM3IiwiaWQiOiJUMzciLCJtdXRhdGlvbiI6Ik0zNyIsInRvIjoicm91bmRfMl9pbnRlcnByZXRpbmcifQ
    phase_revision_requested -->|T37| phase_round_2_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzgiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJGSU5BTElaQVRJT05fSU5WQUxJREFURVNfQ0FORElEQVRFIiwiZnJvbSI6ImZpbmFsaXppbmciLCJndWFyZCI6IkczOCIsImlkIjoiVDM4IiwibXV0YXRpb24iOiJNMzgiLCJ0byI6ImNvbXBvc2l0ZV9kcmFmdGluZyJ9
    phase_finalizing -->|T38| phase_composite_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBMzkiLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJESVJFQ1RPUl9DTEFSSUZZX1JFVFVSTiIsImZyb20iOiJyZXZpc2lvbl9yZXF1ZXN0ZWQiLCJndWFyZCI6IkczOSIsImlkIjoiVDM5IiwibXV0YXRpb24iOiJNMzkiLCJ0byI6InJldmlzaW9uX3JlcXVlc3RlZCJ9
    phase_revision_requested -->|T39| phase_revision_requested
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDAiLCJhdXRob3JpdHkiOiJBVTAzIiwiZXZlbnQiOiJGSU5BTElaQVRJT05fSU5WQUxJREFURVNfUjIiLCJmcm9tIjoiZmluYWxpemluZyIsImd1YXJkIjoiRzQwIiwiaWQiOiJUNDAiLCJtdXRhdGlvbiI6Ik00MCIsInRvIjoicm91bmRfMl9pbnRlcnByZXRpbmcifQ
    phase_finalizing -->|T40| phase_round_2_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDEiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJDT01QTEVURV9JTklUSUFMSVpBVElPTiIsImZyb20iOiJpbml0aWFsaXppbmciLCJndWFyZCI6Ikc0MSIsImlkIjoiVDQxIiwibXV0YXRpb24iOiJNNDEiLCJ0byI6ImluaXRpYWxpemVkIn0
    phase_initializing -->|T41| phase_initialized
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDIiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJTQVZFX1IxX0lOU1RSVU1FTlRfRFJBRlQiLCJmcm9tIjoicm91bmRfMV9kcmFmdGluZyIsImd1YXJkIjoiRzQyIiwiaWQiOiJUNDIiLCJtdXRhdGlvbiI6Ik00MiIsInRvIjoicm91bmRfMV9kcmFmdGluZyJ9
    phase_round_1_drafting -->|T42| phase_round_1_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDMiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJTQVZFX1IxX0lOVEVSUFJFVEFUSU9OX0RSQUZUIiwiZnJvbSI6InJvdW5kXzFfaW50ZXJwcmV0aW5nIiwiZ3VhcmQiOiJHNDMiLCJpZCI6IlQ0MyIsIm11dGF0aW9uIjoiTTQzIiwidG8iOiJyb3VuZF8xX2ludGVycHJldGluZyJ9
    phase_round_1_interpreting -->|T43| phase_round_1_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDQiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJTQVZFX1IyX0lOU1RSVU1FTlRfRFJBRlQiLCJmcm9tIjoicm91bmRfMl9kcmFmdGluZyIsImd1YXJkIjoiRzQ0IiwiaWQiOiJUNDQiLCJtdXRhdGlvbiI6Ik00NCIsInRvIjoicm91bmRfMl9kcmFmdGluZyJ9
    phase_round_2_drafting -->|T44| phase_round_2_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDUiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJTQVZFX1IyX0lOVEVSUFJFVEFUSU9OX0RSQUZUIiwiZnJvbSI6InJvdW5kXzJfaW50ZXJwcmV0aW5nIiwiZ3VhcmQiOiJHNDUiLCJpZCI6IlQ0NSIsIm11dGF0aW9uIjoiTTQ1IiwidG8iOiJyb3VuZF8yX2ludGVycHJldGluZyJ9
    phase_round_2_interpreting -->|T45| phase_round_2_interpreting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDYiLCJhdXRob3JpdHkiOiJBVTAxIiwiZXZlbnQiOiJTQVZFX0NPTVBPU0lURV9EUkFGVCIsImZyb20iOiJjb21wb3NpdGVfZHJhZnRpbmciLCJndWFyZCI6Ikc0NiIsImlkIjoiVDQ2IiwibXV0YXRpb24iOiJNNDYiLCJ0byI6ImNvbXBvc2l0ZV9kcmFmdGluZyJ9
    phase_composite_drafting -->|T46| phase_composite_drafting
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBNDciLCJhdXRob3JpdHkiOiJBVTAyIiwiZXZlbnQiOiJESVJFQ1RPUl9XSVRIRFJBV19SRVRVUk4iLCJmcm9tIjoicmV2aXNpb25fcmVxdWVzdGVkIiwiZ3VhcmQiOiJHNDciLCJpZCI6IlQ0NyIsIm11dGF0aW9uIjoiTTQ3IiwidG8iOiJhd2FpdGluZ19yYXRpZmljYXRpb24ifQ
    phase_revision_requested -->|T47| phase_awaiting_ratification
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBRjAxIiwiYXV0aG9yaXR5IjoiQVUwNCIsImNvdXBsZWRGYW1pbHkiOiJSRjAxIiwiZXZlbnQiOiJBQk9SVCIsImZyb21TZWxlY3RvciI6IlNHMDEiLCJndWFyZCI6IkdGMDEiLCJpZCI6IlRGMDEiLCJtdXRhdGlvbiI6Ik1GMDEiLCJydW50aW1lU2VsZWN0b3IiOiJTUjAxIiwidG8iOiJhYm9ydGVkIn0
    phase_SG01 -->|TF01| phase_aborted
    %% @flow-edge|phase|eyJhY3Rpb24iOiJBRjAyIiwiYXV0aG9yaXR5IjoiQVUwMyIsImV2ZW50IjoiUkVFTUlUX0NVUlJFTlQiLCJmcm9tU2VsZWN0b3IiOiJTRzAyIiwiZ3VhcmQiOiJHRjAyIiwiaWQiOiJURjAyIiwibXV0YXRpb24iOiJNRjAyIiwidG8iOiJzYW1lIn0
    phase_SG02 -->|TF02| phase_SG02
    %% @flow-node|runtime_start|machine-pseudostate|runtime|start
    runtime_start((start))
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTAxIiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiT1BFTl9TRVNTSU9OIiwiZnJvbSI6InN0YXJ0IiwiZ3VhcmQiOiJSRzAxIiwiaWQiOiJSVDAxIiwibXV0YXRpb24iOiJSTTAxIiwidG8iOiJyZWh5ZHJhdGluZyJ9
    runtime_start -->|RT01| runtime_rehydrating
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTAyIiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUFJPQ0VTU19TVEFSVCIsImZyb20iOiJhY3RpdmUiLCJndWFyZCI6IlJHMDIiLCJpZCI6IlJUMDIiLCJtdXRhdGlvbiI6IlJNMDIiLCJ0byI6InJlaHlkcmF0aW5nIn0
    runtime_active -->|RT02| runtime_rehydrating
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTAzIiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUFJPQ0VTU19SRVNUQVJUIiwiZnJvbSI6InJlaHlkcmF0aW5nIiwiZ3VhcmQiOiJSRzAzIiwiaWQiOiJSVDAzIiwibXV0YXRpb24iOiJSTTAzIiwidG8iOiJyZWh5ZHJhdGluZyJ9
    runtime_rehydrating -->|RT03| runtime_rehydrating
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA0IiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUkVTVU1FIiwiZnJvbSI6InN1c3BlbmRlZCIsImd1YXJkIjoiUkcwNCIsImlkIjoiUlQwNCIsIm11dGF0aW9uIjoiUk0wNCIsInRvIjoicmVoeWRyYXRpbmcifQ
    runtime_suspended -->|RT04| runtime_rehydrating
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA1IiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUkVUUlkiLCJmcm9tIjoiYmxvY2tlZF9yZWNvdmVyYWJsZSIsImd1YXJkIjoiUkcwNSIsImlkIjoiUlQwNSIsIm11dGF0aW9uIjoiUk0wNSIsInRvIjoicmVoeWRyYXRpbmcifQ
    runtime_blocked_recoverable -->|RT05| runtime_rehydrating
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA2IiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUkVIWURSQVRJT05fUEFTUyIsImZyb20iOiJyZWh5ZHJhdGluZyIsImd1YXJkIjoiUkcwNiIsImlkIjoiUlQwNiIsIm11dGF0aW9uIjoiUk0wNiIsInRvIjoiYWN0aXZlIn0
    runtime_rehydrating -->|RT06| runtime_active
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA3IiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiUkVDT1ZFUkFCTEVfRkFJTFVSRSIsImZyb20iOiJyZWh5ZHJhdGluZyIsImd1YXJkIjoiUkcwNyIsImlkIjoiUlQwNyIsIm11dGF0aW9uIjoiUk0wNyIsInRvIjoiYmxvY2tlZF9yZWNvdmVyYWJsZSJ9
    runtime_rehydrating -->|RT07| runtime_blocked_recoverable
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA4IiwiYXV0aG9yaXR5IjoiQVUwNSIsImV2ZW50IjoiVEVSTUlOQUxfRkFJTFVSRSIsImZyb20iOiJyZWh5ZHJhdGluZyIsImd1YXJkIjoiUkcwOCIsImlkIjoiUlQwOCIsIm11dGF0aW9uIjoiUk0wOCIsInRvIjoiYmxvY2tlZF90ZXJtaW5hbCJ9
    runtime_rehydrating -->|RT08| runtime_blocked_terminal
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTA5IiwiYXV0aG9yaXR5IjoiQVUwNCIsImV2ZW50IjoiUEFVU0UiLCJmcm9tIjoiYWN0aXZlIiwiZ3VhcmQiOiJSRzA5IiwiaWQiOiJSVDA5IiwibXV0YXRpb24iOiJSTTA5IiwidG8iOiJzdXNwZW5kZWQifQ
    runtime_active -->|RT09| runtime_suspended
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTEwIiwiYXV0aG9yaXR5IjoiQVUwMyIsImV2ZW50IjoiUkVRVUlSRURfREVQRU5ERU5DWV9GQUlMVVJFIiwiZnJvbSI6ImFjdGl2ZSIsImd1YXJkIjoiUkcxMCIsImlkIjoiUlQxMCIsIm11dGF0aW9uIjoiUk0xMCIsInRvIjoiYmxvY2tlZF9yZWNvdmVyYWJsZSJ9
    runtime_active -->|RT10| runtime_blocked_recoverable
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTExIiwiYXV0aG9yaXR5IjoiQVUwMSIsImV2ZW50IjoiVEVSTUlOQUxfU0VNQU5USUNfU0NPUEUiLCJmcm9tIjoiYWN0aXZlIiwiZ3VhcmQiOiJSRzExIiwiaWQiOiJSVDExIiwibXV0YXRpb24iOiJSTTExIiwidG8iOiJibG9ja2VkX3Rlcm1pbmFsIn0
    runtime_active -->|RT11| runtime_blocked_terminal
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTEyIiwiYXV0aG9yaXR5IjoiQVUwMyIsImNvdXBsZWRUcmFuc2l0aW9uIjoiVDM1IiwiZXZlbnQiOiJQSEFTRV9JTlRFTlRfQ0FQVFVSRUQiLCJmcm9tIjoiYWN0aXZlIiwiZ3VhcmQiOiJSRzEyIiwiaWQiOiJSVDEyIiwibXV0YXRpb24iOiJSTTEyIiwidG8iOiJjbG9zZWQifQ
    runtime_active -->|RT12| runtime_closed
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQTEzIiwiYXV0aG9yaXR5IjoiQVUwMyIsImV2ZW50IjoiVEVSTUlOQUxfSU5URUdSSVRZX0ZBSUxVUkUiLCJmcm9tIjoiYWN0aXZlIiwiZ3VhcmQiOiJSRzEzIiwiaWQiOiJSVDEzIiwibXV0YXRpb24iOiJSTTEzIiwidG8iOiJibG9ja2VkX3Rlcm1pbmFsIn0
    runtime_active -->|RT13| runtime_blocked_terminal
    %% @flow-edge|runtime|eyJhY3Rpb24iOiJSQUYwMSIsImF1dGhvcml0eSI6IkFVMDQiLCJjb3VwbGVkRmFtaWx5IjoiVEYwMSIsImV2ZW50IjoiUEhBU0VfQUJPUlRFRCIsImZyb21TZWxlY3RvciI6IlNSMDEiLCJndWFyZCI6IlJHRjAxIiwiaWQiOiJSRjAxIiwibXV0YXRpb24iOiJSTUYwMSIsInRvIjoiY2xvc2VkIn0
    runtime_SR01 -->|RF01| runtime_closed
    %% @flow-question|Q1|T05|round_1_q1_ready|round_1_q1_awaiting
    %% @flow-question|Q2|T07|round_1_q2_ready|round_1_q2_awaiting
    %% @flow-question|Q3|T09|round_1_q3_ready|round_1_q3_awaiting
    %% @flow-question|Q4|T16|round_2_q4_ready|round_2_q4_awaiting
    %% @flow-question|Q5|T18|round_2_q5_ready|round_2_q5_awaiting
    %% @flow-question|Q6|T20|round_2_q6_ready|round_2_q6_awaiting
```

The six `@flow-question` records prove distinct Q1–Q6 lanes. Runtime edges remain visible so a Director-facing view cannot imply progress while the process is suspended, blocked, rehydrating, or closed.
