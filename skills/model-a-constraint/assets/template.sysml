// template.sysml — the canonical SysML v2 constraint (constraint def) SKELETON.
// COPY THIS, rename the generic names (Rule / x / Subject …), then flesh out + validate.
// A constraint is a REUSABLE, parameterized boolean RULE: `in` parameters + a single boolean
// expression that must hold. You author it once, then ASSERT it on a part's attributes (the
// distinction: a constraint is a CHECKABLE spec over data, not prose intent like a requirement).
// Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package ConstraintTemplate {
	import ScalarValues::*;          // String, Boolean, Integer

	// 1. a reusable RULE: `in` parameters + ONE boolean expression that must hold.
	//    Use == (NOT =) for equality; combine with and / or / not / implies / xor.
	constraint def Rule {
		in x : Integer;              // a parameter the rule constrains
		in cap : Integer;
		x > 0 and x <= cap          // the boolean spec (the part you actually author)
	}

	// 2. ASSERT the rule on a part's attributes — bind each `in` parameter to an attribute.
	//    This is where the spec becomes a contract on a concrete thing (see example.sysml).
	part def Subject {
		attribute amount : Integer;
		attribute limit : Integer;
		assert constraint amountValid : Rule {     // a named assertion you can read in a query
			in x = amount;                         // bind the rule's parameter to this part's data
			in cap = limit;
		}
	}
}
