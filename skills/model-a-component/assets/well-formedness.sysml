// well-formedness.sysml — the decidable component rules as SysML constraint defs.
// A SPEC (a checkable contract), NOT auto-checked by the syntax gate: syntaxErrors==0 says the text parses,
// it does NOT say the breakdown is well-formed. A future linter — or you, by hand — evaluates these.
// See sysml-literacy/references/validating-sysml.md. (syntaxErrors == 0.)
package ComponentWellFormedness {
	doc /* The decidable well-formedness rules every component breakdown should satisfy. */
	constraint def EveryRefResolves    { in resolves : Boolean; resolves }    // each ref/part names a declared def
	constraint def EveryAttributeTyped { in hasType : Boolean; hasType }       // each attribute has a type
	constraint def MultiplicitySane    { in sane : Boolean; sane }            // [lo..hi] with lo <= hi
}
