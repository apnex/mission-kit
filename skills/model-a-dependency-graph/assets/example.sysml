// example.sysml — a worked dependency graph: a build/task DAG.
// ONE node kind (Task) joined to itself by `ref dependsOn` edges that encode build ORDER. The topology
// (compile -> test -> package -> deploy, with package also depending on compile) IS the model; it is a DAG.
// Shows the two ways to present a graph: the NODE KIND (the schema) + a wired GRAPH of instances (the data).
// (syntaxErrors == 0.)
package BuildPipeline {
	import ScalarValues::*;
	doc /* A build pipeline as a dependency graph: tasks joined by precedence edges. A `ref dependsOn` edge
	     means "this task must run AFTER that one" — order, not ownership. The graph is ACYCLIC (a DAG):
	     follow dependsOn and you never return to where you started. Cycle DETECTION is a hand-scan / a
	     constraint (see well-formedness.sysml), NOT something the parser checks. */

	// THE NODE KIND — the graph's schema. Every node is a Task; the only edge is precedence.
	part def Task {
		attribute name : String;
		ref dependsOn : Task[0..*];          // OUT-EDGES: the tasks this one must follow. ref (peer), not part (owned).
	}

	// THE GRAPH — real tasks wired into a DAG. Each `:>> dependsOn = (…)` is one node's out-edge set;
	// a node with no dependsOn is a ROOT (here: compile). Read topological order by following the edges.
	part compile : Task;                      // root — depends on nothing
	part test : Task {
		ref dependsOn :>> dependsOn = (compile);          // test after compile
	}
	part packageUp : Task {
		ref dependsOn :>> dependsOn = (compile, test);     // package after compile AND test (a fan-in)
	}
	part deploy : Task {
		ref dependsOn :>> dependsOn = (packageUp);         // deploy after package — the sink
	}

	// THE CONTAINER CASE (documented, deliberately commented out) — wrapping the nodes in a part-owned graph
	// trips THIS validator's spurious "circular containment" advisory (Graph -> Task -> Task -> Graph):
	//     part def Graph { part nodes : Task[1..*]; }
	// It is error-SEVERITY but NOT gated — syntaxErrors stays 0 — because the analyzer conflates the
	// self-`ref dependsOn` edge with the `part` containment. The model is valid SysML; do not distort it to
	// silence the advisory. See ../sysml-literacy/references/validating-sysml.md and model-a-component/assets/example.sysml.
	// Prefer the peer-instance form above (advisory-clean); reach for a container only if you must own the nodes.
}
