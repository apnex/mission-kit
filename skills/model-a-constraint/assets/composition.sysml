// composition.sysml — the advanced extension: COMPOSING constraints.
// The single thing a real user reaches for next after a bare rule: build a higher-level rule by
// ASSERTING two named constraints inside a third (conjunction), then assert that composite on a
// part. This is what makes constraints a reusable SPEC LIBRARY — small rules combine into named
// invariants — rather than one-off inline expressions. (syntaxErrors == 0.)
package OrderInvariants {
	import ScalarValues::*;
	doc /* A composite order invariant built from two reusable atoms. Each atom is independently
	     reusable; the composite names a meaningful business invariant by composing them. The same
	     atoms can be reused in other composites — that is the payoff over an inline expression. */

	// two reusable ATOMS
	constraint def NonNegative { in n : Integer; n >= 0 }
	constraint def AtMost      { in n : Integer; in cap : Integer; n <= cap }

	// a COMPOSITE rule: asserts both atoms over the same parameters (conjunction by composition).
	// Reuse beats repetition — change NonNegative once and every composite that uses it follows.
	constraint def WithinAllowance {
		in qty : Integer;
		in allowance : Integer;
		assert constraint NonNegative { in n = qty; }
		assert constraint AtMost      { in n = qty; in cap = allowance; }
	}

	// the subject: assert the COMPOSITE on the part's attributes (one assertion covers both atoms).
	part def OrderLine {
		attribute quantity : Integer;
		attribute maxPerLine : Integer;
		assert constraint quantityWithinAllowance : WithinAllowance {
			in qty = quantity;
			in allowance = maxPerLine;
		}
	}
}
