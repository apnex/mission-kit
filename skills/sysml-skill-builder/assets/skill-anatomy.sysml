// skill-anatomy.sysml — a SysML-anchored modelling PRIMITIVE skill, modelled as a COMPONENT.
// The dogfood + the proof of the subject-vs-artifact thesis: a skill is a composite ARTIFACT (prose + assets +
// reference + declared edges), not a model. The Asset subtypes are the FIXED 5-asset scaffold; a meta-skill
// (like this one) varies the asset set, so this models a model-a-X primitive. (syntaxErrors == 0.)
package SkillAnatomy {
	import ScalarValues::*;
	doc /* The anatomy of a modelling primitive skill, as a part def. Built with model-a-component idioms. */

	abstract part def Asset;
	part def Template       :> Asset;   // assets/template.sysml — the skeleton to copy
	part def Example        :> Asset;   // assets/example.sysml — a worked model
	part def Advanced       :> Asset;   // the most valuable construct-specific extension (guarded/cascade/specialization)
	part def Procedure      :> Asset;   // authoring-procedure.sysml — the procedure as an action def (dogfood)
	part def WellFormedness :> Asset;   // well-formedness.sysml — the decidable rules as constraint defs (dogfood)

	part def SkillDoc { attribute hasFrontmatter : Boolean; }   // SKILL.md (prose: when / author-it / watch-out / validate)
	part def Reference;                                          // references/<construct>.md

	part def ModellingSkill {
		attribute skillName : String;
		attribute construct : String;             // the SysML construct family it teaches — the PARAMETER that varies
		ref prerequisite : ModellingSkill[1..*];  // declared edge: sysml-literacy (+ more for a meta/L2 skill)
		ref composes : ModellingSkill[0..*];      // declared edge: the primitives an L2/meta skill is built from
		part skillDoc : SkillDoc;                 // owns its SKILL.md
		part template : Template;                 // owns the fixed 5-asset scaffold…
		part example : Example;
		part advanced : Advanced;
		part procedure : Procedure;
		part wellFormedness : WellFormedness;
		part reference : Reference;               // owns one construct reference
	}
}
