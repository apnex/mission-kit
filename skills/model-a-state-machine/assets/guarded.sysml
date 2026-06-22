// guarded.sysml — layering a GUARD on the skeleton. Two transitions on the SAME event from the SAME state,
// split by a condition that reads an attribute in scope (`funded`). This is the branch the bare skeleton
// can't express; add it only after the skeleton validates. (syntaxErrors == 0.)
package GuardedWithdrawal {
	doc /* A guard picks between transitions that share a source state and trigger event. */
	item def Withdraw;
	item def Deposit;
	state def Account {
		attribute funded : Boolean;
		entry; then idle;
		state idle;
		state dispensing;
		transition wOk   first idle       accept Withdraw if funded     then dispensing;  // funded -> dispense
		transition wNo   first idle       accept Withdraw if not funded then idle;        // not funded -> stay idle
		transition dDone first dispensing accept Deposit                then idle;
	}
}
