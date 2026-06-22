// orthogonal-axes.sysml — the advanced asset: ONE thing classified along THREE+ orthogonal axes.
// The most valuable construct-specific extension of a classification is MORE independent dimensions,
// demonstrating that each enum is a separate axis you can vary, query and reason about alone.
// Modelled on the arc's real classification: an arc summit carries payoff, tier and risk as THREE
// orthogonal enums (a high-payoff item can be low- or high-risk; tier is independent of both), plus
// a multi-valued tag axis. (syntaxErrors == 0.)
package ArcSummitClassification {
	import ScalarValues::*;
	doc /* An arc summit classified along independent dimensions. payoff, tier and risk are three
	     SEPARATE enums — orthogonal axes — so the classification space is their product, not a single
	     hand-enumerated list. A fourth axis (tags) is multi-valued: a thing can carry several tags. */

	// AXIS 1 — payoff: how much value the summit returns.
	enum def Payoff { low; medium; high; }

	// AXIS 2 — tier: how foundational it is. Independent of payoff.
	enum def Tier { exploratory; load_bearing; sovereign; }

	// AXIS 3 — risk: how likely it is to fail. Independent of payoff AND tier.
	enum def Risk { low; medium; high; }
	// NB: `low`/`medium`/`high` recur in Payoff and Risk — that is FINE. Enum literals are scoped to
	// their enum def, so `Payoff::high` and `Risk::high` are distinct values on distinct axes.

	// AXIS 4 — tags: a MULTI-VALUED axis. A summit can sit in several tag buckets at once, so the
	// attribute is enum-typed with multiplicity [0..*] (single-valued axes use the default [1]).
	enum def Tag { infra; docs; tooling; research; }

	part def Summit {
		attribute name : String;                        // ordinary data
		attribute payoff : Payoff = Payoff::medium;     // single-valued AXIS 1
		attribute tier : Tier = Tier::exploratory;      // single-valued AXIS 2 (orthogonal to AXIS 1)
		attribute risk : Risk = Risk::medium;           // single-valued AXIS 3 (orthogonal to 1 and 2)
		attribute tags : Tag[0..*];                     // MULTI-valued AXIS 4 (zero or more tags)
	}
}
