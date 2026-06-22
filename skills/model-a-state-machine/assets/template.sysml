// template.sysml — the canonical SysML v2 state-machine SKELETON.
// COPY THIS, rename the generic names (Machine / stateA / EventOne …), then flesh out + validate.
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package MachineTemplate {

	// 1. the events the machine reacts to — one `item def` each
	item def EventOne;
	item def EventTwo;

	// 2. the machine — an INITIAL state, the states, and the transitions
	state def Machine {
		entry; then stateA;                                        // the initial state
		state stateA;
		state stateB;
		transition t1 first stateA accept EventOne then stateB;    // from stateA, on EventOne -> stateB
		transition t2 first stateB accept EventTwo then stateA;    // a way back
	}
}
