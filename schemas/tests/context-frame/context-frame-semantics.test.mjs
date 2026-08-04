import assert from "node:assert/strict";
import test from "node:test";
import { validateContextFrameSemantics } from "../../context-frame/v1alpha1/context-frame.validator.mjs";
import {
  clone,
  readContextFrameExample,
  validateContextFrameStructure
} from "../support/context-frame-validation.mjs";

function issueCodes(contextFrame) {
  assert.equal(
    validateContextFrameStructure(contextFrame),
    true,
    JSON.stringify(validateContextFrameStructure.errors)
  );
  return validateContextFrameSemantics(contextFrame).map((entry) => entry.code);
}

test("representative ContextFrame resources have no semantic violations", () => {
  assert.deepEqual(
    issueCodes(readContextFrameExample("application-messaging.context-frame.json")),
    []
  );
  assert.deepEqual(
    issueCodes(readContextFrameExample("minimal-decision.context-frame.json")),
    []
  );
});

test("semantic validation rejects an exact duplicate included boundary", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.scope.included.push(contextFrame.spec.scope.included[0]);
  assert.deepEqual(issueCodes(contextFrame), ["DUPLICATE_INCLUDED_BOUNDARY"]);
});

test("semantic validation rejects an exact duplicate excluded boundary", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.scope.excluded.push(contextFrame.spec.scope.excluded[0]);
  assert.deepEqual(issueCodes(contextFrame), ["DUPLICATE_EXCLUDED_BOUNDARY"]);
});

test("semantic validation rejects the same statement across scope boundaries", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.scope.excluded.push(contextFrame.spec.scope.included[1]);
  assert.deepEqual(issueCodes(contextFrame), ["CROSS_BOUNDARY_SCOPE_STATEMENT"]);
});

test("semantic validation rejects duplicate given text within one classification", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.givens.push(structuredClone(contextFrame.spec.givens[0]));
  assert.deepEqual(issueCodes(contextFrame), ["DUPLICATE_GIVEN"]);
});

test("semantic validation rejects duplicate given text across classifications", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.givens.push({
    classification: "constraint",
    text: contextFrame.spec.givens[0].text
  });
  assert.deepEqual(issueCodes(contextFrame), ["DUPLICATE_GIVEN"]);
});

test("semantic validation rejects a duplicate term even when its meaning differs", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.terms.push({
    term: contextFrame.spec.terms[0].term,
    meaning: "A second meaning cannot redefine an existing term."
  });
  assert.deepEqual(issueCodes(contextFrame), ["DUPLICATE_TERM"]);
});

test("duplicate comparison preserves exact authored string values without normalization", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.scope.included.push(`${contextFrame.spec.scope.included[0]} `);
  contextFrame.spec.givens.push({
    classification: "fact",
    text: contextFrame.spec.givens[0].text.toUpperCase()
  });
  contextFrame.spec.terms.push({
    term: contextFrame.spec.terms[0].term.toUpperCase(),
    meaning: "Case remains authored semantic content."
  });
  assert.deepEqual(issueCodes(contextFrame), []);
});

test("semantic issues identify the exact duplicate or conflicting member", () => {
  const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
  contextFrame.spec.scope.included.push(contextFrame.spec.scope.included[0]);
  contextFrame.spec.scope.excluded.push(contextFrame.spec.scope.included[1]);
  contextFrame.spec.givens.push(structuredClone(contextFrame.spec.givens[0]));
  contextFrame.spec.terms.push(structuredClone(contextFrame.spec.terms[0]));

  assert.deepEqual(
    validateContextFrameSemantics(contextFrame).map(({ code, path }) => ({ code, path })),
    [
      {
        code: "DUPLICATE_INCLUDED_BOUNDARY",
        path: "/spec/scope/included/3"
      },
      {
        code: "CROSS_BOUNDARY_SCOPE_STATEMENT",
        path: "/spec/scope/excluded/2"
      },
      {
        code: "DUPLICATE_GIVEN",
        path: "/spec/givens/3/text"
      },
      {
        code: "DUPLICATE_TERM",
        path: "/spec/terms/2/term"
      }
    ]
  );
});
