// authoring-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about authoring dependency graphs carries its OWN procedure as a workflow. Read it
// with sysml-literacy; it IS the method you follow. The penultimate step is a REVIEW (checkAcyclic) before
// validate — the mandatory review-before-handoff step every catalogue procedure carries. (syntaxErrors == 0.)
package AuthoringADependencyGraph {
	doc /* How to author a dependency graph in SysML v2 — the procedure, as an ordered activity. */
	action def AuthorADependencyGraph {
		in subjectGraph : String;                       // what the graph is OF (build tasks, modules, …)
		action listNodes;      then defineNodeKind;     // 1. enumerate the nodes — the things that depend on each other
		action defineNodeKind; then wireEdges;          // 2. ONE part def for the node kind, with `ref dependsOn : Node[0..*]`
		action wireEdges;      then addEdgeKinds;        // 3. wire the actual edges: node instances + `:>> dependsOn = (…)`
		action addEdgeKinds;   then checkAcyclic;        // 4. (optional) distinguish edge kinds / layers — the advanced form
		action checkAcyclic;   then validate;            // 5. REVIEW: is it a DAG? follow dependsOn — no edge returns to its origin; every edge resolves; multiplicity [0..*]
		action validate;                                 // 6. parser syntaxErrors==0, then scan (cycles are NOT a parse error)
	}
}
