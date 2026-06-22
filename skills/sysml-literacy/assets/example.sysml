// example.sysml — a small, COMPLETE SysML v2 model to practice reading against.
// Deliberately tiny + cross-domain: components + a state machine + a workflow + a requirement + an edge.
// Read it top to bottom, then use references/reading-a-model.md to answer questions about it.
package BuildPipeline {
	doc /* A tiny CI pipeline. Everything you need to read a real model appears here once. */
	import ScalarValues::*;   // String, Boolean, Integer

	// ---- classification: a fixed set of named values ----
	enum def BuildState { idle; running; passed; failed; }

	// ---- components: a KIND of thing (`part def`) with typed attributes ----
	part def Repository {
		attribute url : String;
		attribute branch : String;
	}
	part def Builder {
		attribute image : String;
		attribute parallelJobs : Integer;
		ref source : Repository;          // a Builder reads from a Repository (a reference, not ownership)
	}
	part def Deployer {
		attribute environment : String;
		ref builtBy : Builder;            // a Deployer depends on a Builder
	}

	// ---- a requirement the pipeline must satisfy ----
	requirement def GreenBeforeDeploy {
		attribute statement : String;     // "deploy only from a passed build"
	}

	// ---- the events the lifecycle accepts (`item def`) ----
	item def Triggered;
	item def TestsGreen;
	item def TestsRed;
	item def Retried;
	item def Cleared;

	// ---- the build lifecycle: a STATE MACHINE (`state def`) ----
	state def BuildLifecycle {
		entry; then idle;
		state idle;
		state running;
		state passed;
		state failed;
		transition tStart first idle    accept Triggered  then running;
		transition tPass  first running accept TestsGreen then passed;
		transition tFail  first running accept TestsRed   then failed;
		transition tRetry first failed  accept Retried    then running;
		transition tReset first passed  accept Cleared    then idle;
	}

	// ---- the build WORKFLOW: an ordered activity (`action def`) ----
	action def RunBuild {
		in repo : Repository;
		action checkout; then compile;
		action compile;  then runTests;
		action runTests; then publish;
		action publish;
	}

	// ---- an INSTANCE (read `:>` = subsets/specializes, `:>>` = redefines a value) ----
	part def Pipeline {
		part builders : Builder[*];                // a Pipeline owns some builders
	}
	part nightlyPipeline : Pipeline {
		part fastBuilder : Builder :> builders {   // fastBuilder IS a Builder, subsetting `builders`
			:>> parallelJobs = 8;                  // parallelJobs redefined to 8
		}
	}
}
