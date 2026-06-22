// well-formedness.sysml — the decidable FSM well-formedness rules as SysML constraint defs.
// These are a SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the
// text parses, it does NOT say the machine is well-formed. A future linter — or you, by hand — evaluates
// these. See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package StateMachineWellFormedness {
	doc /* The decidable well-formedness rules every state machine should satisfy. */
	constraint def EveryTransitionHasTarget { in hasTarget : Boolean; hasTarget }  // each transition names a `then <state>`
	constraint def EveryStateReachable      { in reachable : Boolean; reachable }  // every non-initial state is some transition's `then`
	constraint def EveryEventUsed           { in used : Boolean; used }            // every declared event appears in some `accept`
}
