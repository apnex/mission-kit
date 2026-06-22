// well-formedness.sysml — the decidable dependency-graph rules as SysML constraint defs.
// A SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the text parses,
// it does NOT say the graph is well-formed — in particular the gate does NOT check ACYCLICITY. A future
// linter — or you, by hand — evaluates these. See ../sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package DependencyGraphWellFormedness {
	doc /* The decidable well-formedness rules every dependency graph should satisfy. */
	constraint def EveryEdgeResolves { in resolves : Boolean; resolves }      // each dependsOn target names a declared node
	constraint def IsAcyclic         { in acyclic : Boolean; acyclic }        // following dependsOn never returns to a start — a DAG (HAND-SCAN: NOT gated)
	constraint def EdgeMultiplicitySane { in sane : Boolean; sane }           // dependsOn is [0..*] — a root depends on nothing
	constraint def EdgesPointDownward { in downward : Boolean; downward }     // (layered form) an edge targets the same-or-lower layer only
}
