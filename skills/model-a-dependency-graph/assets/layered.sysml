// layered.sysml — the ADVANCED extension: a LAYERED dependency graph (the most valuable next step).
// The plain DAG says "X must come after Y". A LAYERED graph adds a directional INVARIANT on the edges:
// each node sits in a layer, and an edge may only point at the SAME or a LOWER layer — the classic
// architecture rule "depend downward only, never upward". The layer is a node attribute; the constraint
// over the edges (see well-formedness.sysml: EdgesPointDownward) is the decidable rule a linter/you check.
// This is still ONE node kind + a self `ref` edge — layering is a refinement of the same skeleton.
// (syntaxErrors == 0.)
package LayeredArchitecture {
	import ScalarValues::*;
	doc /* A module dependency graph with architectural layers. app -> domain -> platform: a module may
	     depend only on its own or a lower layer. Subtypes pin each kind's layer; the downward-only rule is
	     a constraint over the dependsOn edges, scanned (not parsed). Still acyclic — layering makes most
	     cycles structurally impossible but does not by itself guarantee acyclicity within a layer. */

	enum def Layer { app; domain; platform; }   // ordered high -> low: app is top, platform is bottom

	// the abstract NODE kind — all modules share name + layer + the dependency edge
	abstract part def Module {
		attribute name : String;
		attribute layer : Layer;
		ref dependsOn : Module[0..*];            // may only point at same-or-lower layer (EdgesPointDownward)
	}

	// one subtype per layer — each PINS its layer with a redefinition (:>> layer = …)
	part def AppModule      :> Module { attribute layer : Layer :>> layer = Layer::app; }
	part def DomainModule   :> Module { attribute layer : Layer :>> layer = Layer::domain; }
	part def PlatformModule :> Module { attribute layer : Layer :>> layer = Layer::platform; }

	// a wired graph: ui (app) -> orders (domain) -> persistence (platform). Every edge points downward.
	part persistence : PlatformModule;                       // bottom layer, a root
	part orders : DomainModule {
		ref dependsOn :>> dependsOn = (persistence);         // domain -> platform: legal (downward)
	}
	part ui : AppModule {
		ref dependsOn :>> dependsOn = (orders);              // app -> domain: legal (downward)
	}
	// An UPWARD edge (e.g. persistence depending on ui) would parse fine but VIOLATE EdgesPointDownward —
	// the parser will NOT catch it; that is the hand-scan / constraint this advanced form is about.
}
