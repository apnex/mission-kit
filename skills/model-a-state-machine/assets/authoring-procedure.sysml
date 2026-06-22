// authoring-procedure.sysml — the procedure THIS skill teaches, modelled in the notation it teaches.
// The capstone dogfood: an authoring skill that says "model your process as a workflow" should carry its
// OWN process as a workflow. Read it with sysml-literacy; it IS the method you follow. (syntaxErrors == 0.)
package AuthoringAStateMachine {
	doc /* How to author a state machine in SysML v2 — the procedure, modelled as an ordered activity. */
	action def AuthorAStateMachine {
		in thing : String;            // the thing whose lifecycle you are modelling
		action listStates;      then pickInitial;     // 1. the mutually-exclusive conditions it can be in
		action pickInitial;     then listEvents;       // 2. entry; then <state>; — where it starts
		action listEvents;      then wireTransitions;  // 3. one item def per trigger
		action wireTransitions; then checkTerminals;   // 4. transition t first FROM accept EVENT [if <cond>] then TO
		action checkTerminals;  then validate;         // 5. which terminals are reopenable? a dead-end is a choice
		action validate;                               // 6. parser syntaxErrors==0, then scan reachability/unused
	}
}
