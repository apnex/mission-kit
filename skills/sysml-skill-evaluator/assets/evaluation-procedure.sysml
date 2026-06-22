// evaluation-procedure.sysml — the leverage-eval procedure THIS skill teaches, modelled as a workflow (dogfood).
// Measures whether a skill conveys understanding the BASE model lacks — not whether it restates SysML. (syntaxErrors == 0.)
package EvaluatingASkill {
	doc /* How to evaluate whether a skill conveys understanding the base model lacks — as an ordered activity. */
	action def EvaluateSkillLeverage {
		in skill : String;            // the skill under evaluation
		action pickConventions;  then withholdThem;    // 1. list the methodology conventions the skill claims to teach
		action withholdThem;     then setArms;          // 2. build tasks that NEED them, but do NOT state them in the task
		action setArms;          then blindSolve;       // 3. treatment = agent+skill, control = agent+grammar-primer; FORMAT held constant
		action blindSolve;       then blindJudge;       // 4. solver blind to arm; same model + neutral question to both arms
		action blindJudge;       then computeDelta;     // 5. judge blind, scoring vs the convention-derived key
		action computeDelta;     then reviewSoundness;  // 6. per-convention treatment-minus-control delta
		action reviewSoundness;  then verdict;          // 7. REVIEW: format constant? conventions withheld? control not at ceiling? (no leak)
		action verdict;                                 // 8. skill-unique conventions (big delta) vs innate (delta ~0)
	}
}
