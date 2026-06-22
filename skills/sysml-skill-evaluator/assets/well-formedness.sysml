// well-formedness.sysml — the criteria a SOUND skill-leverage eval must meet, as constraint defs.
// Hard-won across v1->v4: THREE evals returned a false null because one of these was violated (the convention
// was leaked into the task, so the control got it free). A SPEC the evaluator checks before trusting a result.
// (syntaxErrors == 0.)
package LeverageEvalWellFormedness {
	doc /* The criteria a sound skill-leverage eval must meet. Violate one and the result is an uninformative null. */
	constraint def FormatHeldConstant   { in held : Boolean; held }        // both arms use the SAME medium (no prose-vs-model confound)
	constraint def ConventionsWithheld  { in withheld : Boolean; withheld } // the rule is NOT stated in the task (else control gets it free -> null)
	constraint def ControlFormatMatched { in matched : Boolean; matched }   // control = grammar-only baseline (no methodology), comparable length
	constraint def JudgeIsBlind         { in blind : Boolean; blind }       // solver AND judge do not know which arm produced an output
	constraint def MetricDiscriminates  { in variance : Boolean; variance } // control is NOT pinned at the ceiling (else the metric is uninformative)
	constraint def ConventionIsLoadBearing { in required : Boolean; required } // the withheld rule is NECESSARY to score the key (else a task solvable without it -> false null, or noise read as signal)
	// (Boolean-stub params match the sibling well-formedness convention; the criteria are NECESSARY, not sufficient.)
}
