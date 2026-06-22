// reading-procedure.sysml — the very procedure this skill teaches, modelled in the notation it teaches.
// The capstone dogfood: once you can read `assets/example.sysml`, you can read THIS — and it IS the
// method you just used. Syntax-checked against a SysML v2 parser (syntaxErrors == 0).
package ReadingAModel {
	doc /* How to read a SysML model to answer a question about it — as an ordered activity. */

	action def ReadAModel {
		in model : String;          // the model text
		in question : String;       // what you need to answer
		action orient;      then components;   // 1. read the package doc + enums = the vocabulary
		action components;  then behavior;     // 2. part defs + their attributes + refs = structure + dependencies
		action behavior;    then workflow;     // 3. state defs = states + transitions (from / accept / to)
		action workflow;    then relations;    // 4. action defs = the ordered steps
		action relations;   then answer;       // 5. follow ref / :> / qualified-name edges
		action answer;                         // 6. answer ONLY from what the text asserts
	}
}
