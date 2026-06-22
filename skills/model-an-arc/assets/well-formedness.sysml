// well-formedness.sysml — the decidable rules a well-formed arc model satisfies, as constraint defs.
// A SPEC the tester / a future linter checks — NOT auto-evaluated by the syntax gate. (syntaxErrors == 0.)
package ArcWellFormedness {
	doc /* The decidable rules a well-formed arc model satisfies. */
	constraint def ComposesAllSix        { in present : Boolean; present }     // all six primitives' constructs present (composes-vs-model)
	constraint def TerminalsReopenable   { in reopenable : Boolean; reopenable } // every terminal state has an edge back to candidate
	constraint def DeferralsHaveTrigger  { in armed : Boolean; armed }         // anti-amnesia: every deferred Rung carries a revivalTrigger; every parked/terminal arc reopens only via RevivalTriggerFired
	constraint def BuildsOnShippedBanked { in ok : Boolean; ok }              // buildsOn rests only on shipped+banked substrate
	constraint def DepsAcyclic           { in acyclic : Boolean; acyclic }     // the dependsOn DAG is acyclic
}
