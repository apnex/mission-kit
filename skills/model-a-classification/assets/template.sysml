// template.sysml — the canonical SysML v2 classification SKELETON.
// COPY THIS, rename the generic names (Priority / WorkItem …), then add YOUR axes + validate.
// The key idea: each `enum def` is ONE classification AXIS (a fixed set of values along a single
// dimension); a thing is classified by carrying it as an enum-typed `attribute`. A thing along
// SEVERAL independent dimensions carries SEVERAL enum-typed attributes — one per axis.
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package ClassificationTemplate {
	import ScalarValues::*;          // String, Boolean, Integer (for non-classification data)

	// 1. one AXIS = one enum def — a fixed, mutually-exclusive set of values along a single dimension.
	enum def Priority { low; medium; high; }

	// 2. the thing being classified carries the axis as an enum-typed attribute.
	//    A default value is optional: `= Priority::medium` (qualified) or `= medium`.
	part def WorkItem {
		attribute title : String;                       // ordinary data, not a classification
		attribute priority : Priority = Priority::low;  // classified along the Priority AXIS
		// Add ONE attribute per orthogonal axis — do NOT jam two dimensions into one enum.
	}
}
