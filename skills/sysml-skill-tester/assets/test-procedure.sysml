// test-procedure.sysml — the acceptance-test bar THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about testing skills carries its OWN procedure as a workflow. (syntaxErrors == 0.)
package TestingASkill {
	doc /* How to verify a SysML-anchored modelling skill — the acceptance-test bar, as an ordered activity. */
	action def TestAModellingSkill {
		in skill : String;            // the skill under test
		action authorFresh;      then gateValidate;     // 1. author a FRESH model from the skill ALONE (a new domain)
		action gateValidate;     then auditConsistency;  // 2. run the gate — require syntaxErrors==0
		action auditConsistency; then verifyClaims;       // 3. cross-links resolve? no self-contradiction vs validating-sysml?
		action verifyClaims;     then judge;              // 4. GATE-VERIFY every "X parses" claim against the validator
		action judge;                                     // 5. verdict: correct + consistent? must-fix vs nice-to-have
	}
}
