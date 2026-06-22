// well-formedness.sysml — the decidable workflow rules as SysML constraint defs.
// A SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the text parses,
// it does NOT say the workflow is well-formed. A future linter — or you, by hand — evaluates these.
// See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package WorkflowWellFormedness {
	doc /* The decidable well-formedness rules every workflow should satisfy. */
	constraint def EverySuccessionHasTarget { in hasTarget : Boolean; hasTarget }   // each `then` names a declared action
	constraint def EveryActionReachable     { in reachable : Boolean; reachable }   // every action is the start, a `then`, or a branch
	constraint def PinsBoundAtCall          { in bound : Boolean; bound }           // a called action def has its `in` pins bound
}
