import {
  compileExecutableRegistry,
} from "../../../source/authoring/kernel/executable-registry.mjs";
import {
  loadSurveyProfileAuthority,
} from "../../../source/authoring/survey/profile-authority.mjs";
import {
  createSurveyProfileExecutableRegistry,
} from "../../../source/authoring/survey/profile-executables.mjs";

export async function loadProfileScenario() {
  const authority = await loadSurveyProfileAuthority();
  const executables = createSurveyProfileExecutableRegistry({
    bindings: authority.bindings,
  });
  return {
    ...authority,
    compiled: compileExecutableRegistry(executables),
    executables,
  };
}

export function exactInitializationClosure() {
  return {
    apiVersion: "authoring.mission-kit/v1alpha1",
    kind: "ContextClosure",
    metadata: { name: "survey-profile-test-context" },
    spec: {
      closureDigest: `sha256:${"1".repeat(64)}`,
      layers: [
        {
          ordinal: 1,
          role: "intake",
          sourceReference: {
            apiVersion: "authoring.mission-kit/v1alpha1",
            kind: "SourceSnapshot",
            name: "survey-intake",
            semanticDigest: `sha256:${"2".repeat(64)}`,
          },
          selectedValue: [{
            path: "/spec/inventory",
            value: [{
              ordinal: 1,
              logicalName: "intent.txt",
              content: {
                mediaType: "text/plain;charset=utf-8",
                encoding: "base64",
                byteLength: 23,
                data: Buffer.from(
                  "Survey framing intent.\n",
                  "utf8",
                ).toString("base64"),
              },
              rawEvidenceDigest: `sha256:${"4".repeat(64)}`,
            }],
          }],
        },
        {
          ordinal: 2,
          role: "policy",
          sourceReference: {
            apiVersion: "survey.mission-kit/v1alpha1",
            kind: "SurveyPolicySnapshot",
            name: "survey-policy",
            semanticDigest: `sha256:${"3".repeat(64)}`,
          },
          selectedValue: [{
            path: "/spec",
            value: {
              disclosure: "single-current-question",
            },
          }],
        },
      ],
    },
  };
}

export function surveyFrameValues() {
  return {
    subject: "Survey profile authority",
    purpose: "Capture exact intent for the next implementation stage.",
    "outcome-axes": ["authority", "determinism"],
    "scope-included": ["SurveyFrame authoring"],
    synopsis: "Define the Survey boundary before Round authoring.",
  };
}
