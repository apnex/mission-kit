// build-procedure.sysml — the procedure THIS skill teaches, modelled as a workflow (an action def).
// The dogfood: a skill about building skills carries its OWN procedure as a workflow. (syntaxErrors == 0.)
package BuildingASkill {
	doc /* How to build a SysML-anchored modelling skill — the procedure, as an ordered activity. */
	action def BuildAModellingSkill {
		in construct : String;        // the SysML construct family to teach
		action pickConstruct;  then probeIdioms;     // 1. one construct family (state def / action def / part def …)
		action probeIdioms;    then writeAssets;      // 2. gate-PROBE the idioms first — intuition is unreliable
		action writeAssets;    then dogfood;          // 3. the 5-asset scaffold + the SKILL.md sections
		action dogfood;        then declareEdges;     // 4. model the procedure AS an action def, the rules AS constraint defs
		action declareEdges;   then reviewScaffold;    // 5. prerequisite: sysml-literacy (+ composes for L2); keep the lint green
		action reviewScaffold; then handToTester;      // 6. REVIEW (the mandatory gate): scaffold complete? edges resolve? every "X parses" claim gate-verified?
		action handToTester;                           // 7. hand to sysml-skill-tester (the acceptance bar)
	}
}
