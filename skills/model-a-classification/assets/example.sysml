// example.sysml — a worked classification: a work item along TWO orthogonal axes.
// Shows the one distinction that matters: priority and status are INDEPENDENT dimensions, so they
// are TWO separate enum defs carried as TWO separate enum-typed attributes — never one enum with
// every (priority × status) combination jammed in. (syntaxErrors == 0.)
package WorkTracker {
	import ScalarValues::*;
	doc /* A work item classified along two orthogonal axes — urgency (priority) and lifecycle
	     position (status) — kept as separate enums so a query can ask about one without the other. */

	// AXIS 1 — urgency. Independent of where the item is in its lifecycle.
	enum def Priority { low; medium; high; }

	// AXIS 2 — lifecycle position. Independent of how urgent the item is.
	enum def Status { open; active; blocked; closed; }

	part def WorkItem {
		attribute title : String;                          // ordinary data
		attribute priority : Priority = Priority::medium;  // classified on AXIS 1 (with a default)
		attribute status : Status = Status::open;          // classified on AXIS 2 (orthogonal to AXIS 1)
		// Two attributes, two enums: a high-priority item can be open OR closed; an open item can be
		// low OR high. Every (priority, status) pair is independently reachable — that is orthogonality.
	}
}
