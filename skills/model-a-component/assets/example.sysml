// example.sysml — a worked component breakdown: a small service system.
// Shows the ref-vs-part distinction: a Service REFS its Database (dependency) and the System OWNS its
// services + db (composition). Plus service-to-service dependency edges with multiplicity. (syntaxErrors == 0.)
package OrderSystem {
	import ScalarValues::*;
	doc /* A small order system as a component breakdown: services, their data, the orders that flow through
	     them, and how they depend + compose. Shows part def (structure), item def (a flowing thing),
	     ref (dependency) and part (composition). */

	enum def Tier { edge; core; data; }

	// an ITEM that flows through the system — carries data like a part, but is REFERENCED, not owned
	item def Order {
		attribute id : String;
		attribute total : Integer;
	}
	part def Database {
		attribute engine : String;
	}
	part def Service {
		attribute name : String;
		attribute tier : Tier;
		ref store : Database;             // a Service DEPENDS ON a Database (ref — not ownership)
		ref handles : Order[*];           // a Service HANDLES Orders flowing through it (ref — instances it doesn't own)
		ref dependsOn : Service[0..*];    // service-to-service dependency edges
		// NB: this `ref` self-edge to Service — a type System also `part`-owns below — trips this validator's
		// spurious "circular containment" advisory (System -> Service -> System). NOT gated (syntaxErrors=0):
		// the analyzer conflates ref + part, the very distinction this skill teaches. See validating-sysml.md.
	}
	part def System {
		part services : Service[1..*];    // the System OWNS its services (composition)
		part db : Database;               // and owns the database
	}
}
