// template.sysml — the canonical SysML v2 DEPENDENCY GRAPH skeleton.
// COPY THIS, rename the generic names (Node / dependsOn), then add real node instances + edges + validate.
// The whole model is ONE node kind (a part def) joined to ITSELF by a `ref` edge (dependsOn). The graph
// TOPOLOGY is the subject; the edge means ORDER/precedence and the graph must be ACYCLIC (a DAG).
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package DependencyGraphTemplate {
	import ScalarValues::*;          // String

	// 1. the NODE kind — one part def. A node carries its data (attribute) and its OUT-EDGES (ref dependsOn).
	//    `ref` (not `part`): a node POINTS AT the nodes it depends on, it does NOT own them — every node is a
	//    peer in the same graph. Multiplicity [0..*] = "depends on zero-or-more peers" (a root depends on none).
	part def Node {
		attribute name : String;             // data the node carries
		ref dependsOn : Node[0..*];          // the DEPENDENCY EDGE: this node must come AFTER each target. Acyclic.
	}

	// 2. the GRAPH instance — real nodes wired into an actual DAG. Each `:>> dependsOn = (…)` is a node's
	//    out-edge set. Read the order by following dependsOn; a node with `dependsOn = ()` (or none) is a ROOT.
	part a : Node;                           // a root (depends on nothing)
	part b : Node {
		ref dependsOn :>> dependsOn = (a);   // b comes after a
	}
	part c : Node {
		ref dependsOn :>> dependsOn = (a, b); // c comes after a and b
	}
	// NB: keeping the node instances as PEERS (not a `part`-owned container) keeps the model advisory-clean.
	// If you wrap them in a `part def Graph { part nodes : Node[1..*]; }`, the self-`ref dependsOn` trips this
	// validator's spurious "circular containment" advisory (Graph -> Node -> Graph) — error-severity, NOT
	// gated (syntaxErrors stays 0). See example.sysml, which shows + documents that case.
}
