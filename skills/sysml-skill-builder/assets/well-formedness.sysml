// well-formedness.sysml — the decidable rules a well-formed modelling skill satisfies, as constraint defs.
// A SPEC (a checkable contract), evaluated by sysml-skill-tester — NOT auto-checked by the syntax gate.
// See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package SkillWellFormedness {
	doc /* The decidable rules a well-formed modelling skill satisfies. */
	constraint def ScaffoldComplete   { in present : Boolean; present }    // SKILL.md + the asset set + a reference all present
	constraint def EdgesDeclared      { in declared : Boolean; declared }  // prerequisite (+ composes if L2) declared AND resolve
	constraint def ProcedureModelled  { in modelled : Boolean; modelled }  // the procedure is an action def, the rules are constraint defs
	constraint def ProcedureHasReviewStep { in present : Boolean; present } // the procedure's penultimate step is a REVIEW before validate/handoff
	constraint def AssetsGateValid    { in valid : Boolean; valid }        // every .sysml asset is syntaxErrors==0
	constraint def ClaimsGateVerified { in verified : Boolean; verified }  // every "X parses" prose claim was checked against the gate
}
