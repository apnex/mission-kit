// example.sysml — a worked workflow: a deploy pipeline with a DECISION.
// build -> test -> gate, and the gate branches (release on pass, rollback otherwise). (syntaxErrors == 0.)
package DeployPipeline {
	doc /* A deploy pipeline as an ordered activity with a branch: the gate decides release vs rollback. */
	part def Artifact { attribute testsPassed : Boolean; }
	action def Deploy {
		in artifact : Artifact;
		action build;  then test;
		action test;   then gate;
		action gate {
			decide outcome;
			if artifact.testsPassed then release;   // pass -> release
			then rollback;                          // default (no `else`) -> rollback
			action release;
			action rollback;
		}
	}
}
