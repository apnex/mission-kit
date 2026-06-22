// template.sysml — the canonical SysML v2 workflow (action def) SKELETON.
// COPY THIS, rename the generic names (Workflow / stepA / Input …), then flesh out + validate.
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package WorkflowTemplate {

	// 1. the things the workflow consumes / produces (pins are typed by these)
	part def Input;
	part def Output;

	// 2. the workflow — typed in/out pins + an ORDERED chain of actions
	action def Workflow {
		in source : Input;           // what it consumes
		out result : Output;         // what it produces
		action stepA;  then stepB;   // stepA precedes stepB
		action stepB;  then stepC;
		action stepC;                // the last step (no `then`)
		// a DECISION branches the order (no `else` — a bare `then` is the default); see assets/example.sysml:
		// action gate { decide d; if someCond then pathX; then pathY; action pathX; action pathY; }
	}
}
