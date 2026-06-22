// well-formedness.sysml — the decidable classification rules as SysML constraint defs.
// A SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the text
// parses, it does NOT say the classification is well-formed. A future linter — or you, by hand —
// evaluates these. See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package ClassificationWellFormedness {
	doc /* The decidable well-formedness rules every classification should satisfy. */
	constraint def OneEnumPerAxis      { in oneAxis : Boolean; oneAxis }      // each enum is ONE dimension, not a jam of several
	constraint def AxesOrthogonal      { in independent : Boolean; independent } // axes vary independently (no combined enum)
	constraint def EveryAttributeTyped { in hasEnum : Boolean; hasEnum }      // each classified attribute is enum-typed
	constraint def DefaultIsAMember    { in member : Boolean; member }        // any default value is a literal of its own enum
	constraint def LiteralsExclusive   { in exclusive : Boolean; exclusive } // one axis's values are mutually exclusive
	// NB: the obvious name `disjoint` is RESERVED in this gate — `in disjoint : Boolean` parse-fails. Probed; use `exclusive`.
}
