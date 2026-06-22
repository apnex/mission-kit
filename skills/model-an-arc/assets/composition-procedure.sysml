// composition-procedure.sysml — how to author an arc model by COMPOSING the six L1 primitives, as a workflow.
// The dogfood: an L2 system skill carries its own composition procedure as an action def. (syntaxErrors == 0.)
package ComposingAnArc {
	doc /* Author an arc model by composing the L1 primitives — the procedure, as an ordered activity. */
	action def ComposeAnArc {
		in domain : String;            // the staged-work domain you are modelling (subject is a reserved word)
		action entities;         then axes;            // 1. component: Summit/Arc/Rung part defs + reified edges
		action axes;             then dependencies;     // 2. classification: payoff/tier/risk enum axes as attributes
		action dependencies;     then lifecycle;        // 3. dependency-graph: the dependsOn DAG over rungs
		action lifecycle;        then cascade;          // 4. state-machine: the reopenable-terminal FSM
		action cascade;          then invariants;       // 5. workflow: the park cascade (recursion + for + decide)
		action invariants;       then checkComposition; // 6. constraint: anti-amnesia, buildsOn-banked, acyclic
		action checkComposition; then validate;         // 7. REVIEW: all six primitives present? composes-vs-model lint green?
		action validate;                                // 8. parser syntaxErrors==0, then the composes-vs-model gate
	}
}
