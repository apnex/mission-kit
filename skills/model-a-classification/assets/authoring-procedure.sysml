// authoring-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about authoring classifications carries its OWN procedure as a workflow. Read
// it with sysml-literacy; it IS the method you follow. Its penultimate step is a REVIEW (checkAxes)
// before validate — the orthogonality self-audit. (syntaxErrors == 0.)
package AuthoringAClassification {
	doc /* How to author a classification in SysML v2 — the procedure, as an ordered activity. */
	action def AuthorAClassification {
		in thing : String;            // the thing you are classifying
		action listAxes;        then defineEnums;     // 1. name the INDEPENDENT dimensions — one axis each
		action defineEnums;     then attachAttributes; // 2. one enum def per axis; fixed values as literals
		action attachAttributes; then setDefaults;     // 3. one enum-typed attribute per axis on the thing
		action setDefaults;     then checkAxes;        // 4. optional defaults/multiplicity ([1] vs [0..*])
		action checkAxes;       then validate;         // 5. REVIEW: are axes truly orthogonal + non-conflated?
		action validate;                               // 6. parser syntaxErrors==0, then scan (validating-sysml.md)
	}
}
