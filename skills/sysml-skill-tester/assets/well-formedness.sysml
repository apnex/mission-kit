// well-formedness.sysml — the verdict criteria a verified skill must meet, as constraint defs.
// A SPEC the tester evaluates — NOT auto-checked by the syntax gate. (syntaxErrors == 0.)
package VerdictCriteria {
	doc /* The criteria a verified modelling skill must meet. */
	constraint def AuthoringTestPasses  { in passes : Boolean; passes }         // a fresh model authored from the skill ALONE is gate-valid
	constraint def NoFalseParseClaims   { in none : Boolean; none }             // every "X parses/won't-parse" claim matches the gate
	constraint def CrossLinksResolve    { in resolve : Boolean; resolve }       // every cross-link exists on disk
	constraint def InternallyConsistent { in consistent : Boolean; consistent } // no self-contradiction vs the shared validating-sysml ref
}
