// authoring-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about authoring constraints carries its OWN procedure as a workflow. Read it
// with sysml-literacy; it IS the method you follow. The penultimate step is a REVIEW (checkAssertable)
// before validate — the mandatory review-before-validate step every procedure carries. (syntaxErrors == 0.)
package AuthoringAConstraint {
	doc /* How to author a constraint in SysML v2 — the procedure, as an ordered activity. */
	action def AuthorAConstraint {
		in target : String;           // the part whose attributes you are constraining
		action nameTheRule;     then declareParams;    // 1. name the reusable rule (constraint def) — one boolean intent each
		action declareParams;   then writeExpression;  // 2. `in` parameters the rule constrains (Integer/Boolean/…)
		action writeExpression; then assertOnPart;      // 3. ONE boolean expression — use == not =; combine with and/or/not/implies
		action assertOnPart;    then checkAssertable;   // 4. assert constraint c : Rule { in p = attr; } — bind params to attributes
		action checkAssertable; then validate;          // 5. REVIEW: is it a checkable boolean spec (not prose)? every param bound? == not =? reusable vs inline?
		action validate;                                // 6. parser syntaxErrors==0, then scan (gate parses, does NOT evaluate)
	}
}
