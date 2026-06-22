// template.sysml — the canonical SysML v2 component (part def) SKELETON.
// COPY THIS, rename the generic names (Component / Subpart …), then flesh out + validate.
// The key distinction: `attribute` = data · `ref` = a dependency (points at, does NOT own) · `part` =
// composition (OWNS the sub-part). Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package ComponentTemplate {
	import ScalarValues::*;          // String, Boolean, Integer

	// 1. supporting vocabulary (an enum for a fixed-value attribute)
	enum def Kind { kindA; kindB; }

	// 2. a component KIND: data (attribute), a dependency edge (ref), owned sub-parts (part)
	part def Component {
		attribute name : String;          // data the component carries
		attribute kind : Kind;
		ref uses : Dependency[0..*];      // a DEPENDENCY: points at a Dependency, does not own it
		part parts : Subpart[*];          // COMPOSITION: owns its Subparts
	}
	// placeholder kinds — rename / replace with your real types (every ref + part target must resolve to a def)
	part def Dependency;
	part def Subpart;
}
