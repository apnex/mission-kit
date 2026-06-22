// arc-model.sysml — THE arc methodology modelled as a COMPOSED system: all six L1 primitives in one model.
// This is the central asset of model-an-arc (an L2 system skill): the composition IS the deliverable. Generic
// (any staged-work methodology), self-contained, gate-valid (syntaxErrors == 0). The composes-vs-model lint
// checks that each composed primitive's construct family actually appears here.
//   component → part def · classification → enum def · dependency-graph → ref-edge DAG ·
//   constraint → constraint def · state-machine → state def · workflow → action def
// (Note: the reified edges + the Arc-owns-Rung containment trip this validator's spurious "circular containment"
//  advisory — error-severity but NOT gated, syntaxErrors stays 0; see sysml-literacy/references/validating-sysml.md.)
package ArcModel {
	import ScalarValues::*;
	doc /* An arc: a tree of rungs climbing one summit — with a lifecycle, a dependency DAG, orthogonal
	     payoff/tier/risk axes, and the invariants that keep it honest. */

	// ── classification (model-a-classification): three orthogonal enum axes ──
	enum def Payoff { banked; staked; mixed; }
	enum def Tier   { exploratory; load_bearing; sovereign; }   // tier VALUES are the consumer's vocabulary — generic here
	enum def Risk   { low; medium; high; }

	// ── components (model-a-component): entities + reified cross-arc edges ──
	part def Summit { attribute name : String; attribute committed : Boolean; }
	part def Rung {
		attribute name : String;
		attribute payoff : Payoff;            // classification axes carried as attributes
		attribute tier : Tier;
		attribute risk : Risk;
		attribute revivalTrigger : String;    // anti-amnesia: the condition that would revive a deferred rung
		ref dependsOn : Rung[0..*];           // dependency-graph: the build-order DAG (acyclic; author-owned)
		ref cashesInto : Summit;              // which summit this rung advances
	}
	part def Arc {
		attribute name : String;
		part rungs : Rung[1..*];              // an arc OWNS its rungs (composition)
		ref climbs : Summit;                  // the summit this arc climbs
	}
	part def BuildsOn { ref upstream : Arc; ref downstream : Arc; }   // rests on shipped+banked substrate
	part def ReCashes { ref reviver : Arc;  ref dormant : Rung; }     // revives a parked concept elsewhere

	// ── invariants (model-a-constraint): the rules that keep an arc honest ──
	constraint def AntiAmnesia    { in deferred : Boolean; in hasTrigger : Boolean; deferred implies hasTrigger }
	constraint def BuildsOnBanked { in shipped : Boolean; in banked : Boolean; shipped and banked }
	constraint def AcyclicDeps    { in acyclic : Boolean; acyclic }

	// ── lifecycle (model-a-state-machine): reopenable terminals, revive through candidate ──
	item def TargetCommitted; item def LadderEmpty; item def ParkRequested;
	item def RetireRequested;  item def RevivalTriggerFired; item def Archived;
	state def ArcLifecycle {
		entry; then candidate;
		state candidate; state active; state forwardComplete; state closed; state parked; state retired;
		transition tStart   first candidate      accept TargetCommitted     then active;
		transition tClose   first active          accept LadderEmpty         then forwardComplete;
		transition tArchive first forwardComplete accept Archived            then closed;       // fold shut into closed
		transition tFold    first forwardComplete accept RevivalTriggerFired then candidate;   // reopenable
		transition tReopenC first closed          accept RevivalTriggerFired then candidate;   // reopenable terminal
		transition tPark    first active          accept ParkRequested       then parked;
		transition tRetire  first active          accept RetireRequested     then retired;
		transition tReviveP first parked          accept RevivalTriggerFired then candidate;   // reopenable
		transition tReviveR first retired         accept RevivalTriggerFired then candidate;   // reopenable
	}

	// ── the park cascade (model-a-workflow): recursion + for-each + decide ──
	action def CollectPayoffDependents { in seed : Rung; out deps : Rung[0..*]; }
	action def ParkCutCascade {
		in node : Rung;
		action collect : CollectPayoffDependents { in seed = node; }
		then sweep;
		action sweep {
			for dep : Rung in collect.deps {
				decide branch;
				if dep.payoff == Payoff::staked then coPark;
				then reJustify;
				action coPark : ParkCutCascade { in node = dep; }   // recursion: strand-on-a-strand
				action reJustify;
			}
		}
	}
}
