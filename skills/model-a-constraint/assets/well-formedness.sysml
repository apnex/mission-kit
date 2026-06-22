// well-formedness.sysml — the decidable constraint rules as SysML constraint defs.
// A SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the text
// parses, it does NOT say the constraint is well-formed (and this validator PARSES constraints, it does
// NOT evaluate them). A future linter — or you, by hand — checks these. This file also dogfoods the
// construct: the rules ABOUT constraints are themselves constraint defs.
// See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package ConstraintWellFormedness {
	import ScalarValues::*;
	doc /* The decidable well-formedness rules every constraint should satisfy. */
	constraint def HasBooleanBody     { in present : Boolean; present }   // a rule has ONE boolean expression (gate accepts a body-less def — it must NOT ship)
	constraint def UsesEqualityOp     { in correct : Boolean; correct }   // equality is == (single = parse-FAILS in a body)
	constraint def EveryParamUsed     { in used : Boolean; used }         // every `in` parameter appears in the boolean expression
	constraint def EveryParamBound    { in bound : Boolean; bound }       // each assert binds every `in` parameter to an attribute (or literal)
	constraint def IsSpecNotProse     { in checkable : Boolean; checkable } // it is a decidable boolean over data, not prose intent (a requirement)
}
