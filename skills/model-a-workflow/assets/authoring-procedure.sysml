// authoring-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about authoring workflows carries its OWN procedure as a workflow. Read it with
// sysml-literacy; it IS the method you follow. (syntaxErrors == 0.)
package AuthoringAWorkflow {
	doc /* How to author a workflow in SysML v2 — the procedure, as an ordered activity. */
	action def AuthorAWorkflow {
		in thing : String;            // the process you are modelling
		action listSteps;     then orderSteps;      // 1. the discrete actions/steps
		action orderSteps;    then wirePins;        // 2. action a; then b; successions
		action wirePins;      then addDecisions;    // 3. in/out pins — the workflow's I/O
		action addDecisions;  then checkEnds;       // 4. decide / if <cond> then X / then default (optional)
		action checkEnds;     then validate;        // 5. every step reachable? recursion intentional?
		action validate;                            // 6. parser syntaxErrors==0, then scan (validating-sysml.md)
	}
}
