// cascade.sysml — a RECURSIVE workflow: cancelling a task sweeps its dependents.
// for-each + decide + self-recursion. This is the shape a state machine CANNOT express — model-a-state-machine
// defers transition effects (and the arc park cascade) HERE. Mirrors arc-process.sysml's ParkCutCascade.
// (syntaxErrors == 0.)
package CancelCascade {
	doc /* Cancel a task, then sweep its dependents: hard-coupled ones cancel too (recursion), soft ones warn. */
	enum def Coupling { hard; soft; }
	part def Task { attribute coupling : Coupling; }
	action def CollectDependents { in seed : Task; out deps : Task[0..*]; }   // who depends on a task
	action def CancelCascade {
		in node : Task;
		action collect : CollectDependents { in seed = node; }   // collect node's dependents
		then sweep;
		action sweep {
			for dep : Task in collect.deps {
				decide branch;
				if dep.coupling == Coupling::hard then coCancel;   // hard-coupled -> cancel it too
				then warn;                                         // default -> just warn
				action coCancel : CancelCascade { in node = dep; } // RECURSION: cascade into the dependent
				action warn;
			}
		}
	}
}
