import assert from "node:assert/strict";
import test from "node:test";

import {
  resourceReferenceFrom,
} from "../../../source/authoring/kernel/digests.mjs";
import {
  loadSurveyProfileAuthority,
} from "../../../source/authoring/survey/profile-authority.mjs";
import {
  RoundOneQuestionsAuthorityError,
  assertRoundOneInstrumentUnitSemantics,
  buildRoundOneQuestionProducts,
} from "../../../source/authoring/survey/round-one-questions-authority.mjs";
import {
  roundOneQuestionsAuthorityInputs,
} from "./support.mjs";

function changedDigest(reference) {
  const hexadecimal = reference.semanticDigest.slice("sha256:".length);
  return {
    ...reference,
    semanticDigest:
      `sha256:${hexadecimal.startsWith("0") ? "1" : "0"}${
        hexadecimal.slice(1)
      }`,
  };
}

function assertRejectedWithoutMutation({
  code,
  profile,
  input,
  products,
  tamper,
}) {
  const candidate = {
    profile: structuredClone(profile),
    workspace: structuredClone(input.workspace),
    contextClosure: structuredClone(input.contextClosure),
    products: structuredClone(products),
  };
  tamper(candidate);
  const before = structuredClone(candidate);
  assert.throws(
    () => assertRoundOneInstrumentUnitSemantics(candidate),
    (error) =>
      error instanceof RoundOneQuestionsAuthorityError &&
      error.code === code,
  );
  assert.deepEqual(candidate, before);
}

test("AT05 instrument-unit semantics reject every non-exact product, authority reference, edge, and handoff without mutation", async (context) => {
  const input = roundOneQuestionsAuthorityInputs();
  const products = buildRoundOneQuestionProducts(input);
  const { profile } = await loadSurveyProfileAuthority();
  const pristine = structuredClone({ input, products, profile });

  assert.equal(
    assertRoundOneInstrumentUnitSemantics({
      profile,
      workspace: input.workspace,
      contextClosure: input.contextClosure,
      products,
    }),
    true,
  );
  assert.deepEqual({ input, products, profile }, pristine);

  const cases = [
    {
      name: "a different valid policy reference",
      code: "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      tamper({ products: candidateProducts }) {
        const policy = structuredClone(input.resources.policy);
        policy.metadata.name = "other-valid-survey-policy";
        candidateProducts[6].resource.spec.policySnapshotRef =
          resourceReferenceFrom(policy);
      },
    },
    {
      name: "a different valid ContextClosure reference",
      code: "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      tamper({ products: candidateProducts }) {
        const closure = structuredClone(input.resources.contextClosure);
        closure.metadata.name = "other-valid-context-closure";
        candidateProducts[6].resource.spec.generationContextRef =
          resourceReferenceFrom(closure);
      },
    },
    {
      name: "a wrong typed active head",
      code: "ROUND_ONE_QUESTIONS_ACTIVE_HEAD_INVALID",
      tamper({ workspace }) {
        const policyHead = workspace.spec.activeHeads.find(
          ({ slot }) => slot === "policy",
        );
        policyHead.reference = {
          ...policyHead.reference,
          apiVersion: "schemas.mission-kit/v1alpha1",
          kind: "ContextFrame",
        };
      },
    },
    {
      name: "a missing product",
      code: "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts.pop();
      },
    },
    {
      name: "an extra product",
      code: "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts.push(structuredClone(candidateProducts[0]));
      },
    },
    {
      name: "a reordered product descriptor vector",
      code: "ROUND_ONE_INSTRUMENT_UNIT_PRODUCTS_INVALID",
      tamper({ products: candidateProducts }) {
        [candidateProducts[0], candidateProducts[1]] = [
          candidateProducts[1],
          candidateProducts[0],
        ];
      },
    },
    {
      name: "a reordered RoundInstrument unit vector",
      code: "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      tamper({ products: candidateProducts }) {
        const units = candidateProducts[6].resource.spec.units;
        [units[0], units[1]] = [units[1], units[0]];
      },
    },
    {
      name: "a producer-renamed RoundInstrument",
      code: "ROUND_ONE_INSTRUMENT_UNIT_IDENTITY_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts[6].resource.metadata.name =
          "producer-authored-round-instrument-name";
      },
    },
    {
      name: "a missing dependency edge",
      code: "ROUND_ONE_INSTRUMENT_UNIT_DEPENDENCIES_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts[3].dependencies.pop();
      },
    },
    {
      name: "a misdirected dependency edge",
      code: "ROUND_ONE_INSTRUMENT_UNIT_DEPENDENCIES_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts[0].dependencies[0].selector.ordinal = 5;
      },
    },
    {
      name: "an extra dependency edge",
      code: "ROUND_ONE_INSTRUMENT_UNIT_DEPENDENCIES_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts[0].dependencies.push({
          relation: "derived-from",
          selector: { mode: "context-layer", ordinal: 5 },
        });
      },
    },
    {
      name: "a wrong handoff",
      code: "ROUND_ONE_INSTRUMENT_UNIT_HANDOFF_INVALID",
      tamper({ profile: candidateProfile }) {
        const at05 = candidateProfile.spec.transitionBindings.find(
          ({ transitionId }) => transitionId === "AT05",
        );
        at05.mutationFootprint.handoffSlots = ["round-1-question-1"];
      },
    },
    {
      name: "an extra handoff",
      code: "ROUND_ONE_INSTRUMENT_UNIT_HANDOFF_INVALID",
      tamper({ profile: candidateProfile }) {
        const at05 = candidateProfile.spec.transitionBindings.find(
          ({ transitionId }) => transitionId === "AT05",
        );
        at05.mutationFootprint.handoffSlots.push("round-1-question-1");
      },
    },
    {
      name: "a wrong instrument policy digest with otherwise closed shape",
      code: "ROUND_ONE_INSTRUMENT_UNIT_REFERENCE_INVALID",
      tamper({ products: candidateProducts }) {
        candidateProducts[6].resource.spec.policySnapshotRef =
          changedDigest(
            candidateProducts[6].resource.spec.policySnapshotRef,
          );
      },
    },
  ];

  for (const scenario of cases) {
    await context.test(scenario.name, () => {
      assertRejectedWithoutMutation({
        ...scenario,
        profile,
        input,
        products,
      });
    });
  }
});
