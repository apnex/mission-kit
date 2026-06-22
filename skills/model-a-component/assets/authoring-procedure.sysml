// authoring-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about authoring components carries its OWN procedure as a workflow. Read it with
// sysml-literacy; it IS the method you follow. (syntaxErrors == 0.)
package AuthoringAComponent {
	doc /* How to author a component in SysML v2 — the procedure, as an ordered activity. */
	action def AuthorAComponent {
		in thing : String;            // the system you are decomposing
		action listParts;       then addAttributes;    // 1. the component kinds — one part def each (item def if it flows)
		action addAttributes;   then wireStructure;     // 2. attributes — the data each carries
		action wireStructure;   then addSubtypes;       // 3. refs (dependencies) + parts (composition), with multiplicity
		action addSubtypes;     then checkOwnership;    // 4. :> subtypes / :>> redefinitions where useful
		action checkOwnership;  then validate;          // 5. REVIEW: ref-vs-part right? every ref/part resolves? multiplicity sane?
		action validate;                                // 6. parser syntaxErrors==0, then scan
	}
}
