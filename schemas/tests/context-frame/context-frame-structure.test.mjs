import assert from "node:assert/strict";
import test from "node:test";
import {
  clone,
  contextFrameSchema,
  readContextFrameExample,
  validateContextFrameStructure
} from "../support/context-frame-validation.mjs";

function assertStructurallyValid(contextFrame) {
  assert.equal(
    validateContextFrameStructure(contextFrame),
    true,
    JSON.stringify(validateContextFrameStructure.errors)
  );
}

function assertStructurallyInvalid(contextFrame) {
  assert.equal(validateContextFrameStructure(contextFrame), false);
}

test("representative complete and minimal ContextFrame resources validate", () => {
  assertStructurallyValid(readContextFrameExample("application-messaging.context-frame.json"));
  assertStructurallyValid(readContextFrameExample("minimal-decision.context-frame.json"));
});

test("ContextFrame selects the shared resource API and exact kind", async (t) => {
  await t.test("different API version", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.apiVersion = "authoring.mission-kit/v1alpha1";
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("different kind", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.kind = "Context";
    assertStructurallyInvalid(contextFrame);
  });
});

test("ContextFrame reuses the shared resource-metadata contract", () => {
  assert.equal(
    contextFrameSchema.properties.metadata.$ref,
    "urn:mission-kit:schemas:common:resource-metadata:v1alpha1"
  );

  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.metadata.name = "Not a portable resource name";
  assertStructurallyInvalid(contextFrame);
});

test("ContextFrame requires every ratified specification field", async (t) => {
  for (const field of ["subject", "purpose", "scope", "givens", "synopsis", "terms"]) {
    await t.test(field, () => {
      const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
      delete contextFrame.spec[field];
      assertStructurallyInvalid(contextFrame);
    });
  }
});

test("scope requires both exact boundary collections", async (t) => {
  for (const field of ["included", "excluded"]) {
    await t.test(field, () => {
      const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
      delete contextFrame.spec.scope[field];
      assertStructurallyInvalid(contextFrame);
    });
  }
});

test("subject enforces the exact 1 to 160 character bound", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.subject = "s".repeat(160);
  assertStructurallyValid(contextFrame);
  contextFrame.spec.subject = "s".repeat(161);
  assertStructurallyInvalid(contextFrame);
  contextFrame.spec.subject = "";
  assertStructurallyInvalid(contextFrame);
});

test("purpose enforces the exact 1 to 1000 character bound", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.purpose = "p".repeat(1000);
  assertStructurallyValid(contextFrame);
  contextFrame.spec.purpose = "p".repeat(1001);
  assertStructurallyInvalid(contextFrame);
  contextFrame.spec.purpose = "";
  assertStructurallyInvalid(contextFrame);
});

test("synopsis enforces the exact 1 to 320 character bound", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.synopsis = "s".repeat(320);
  assertStructurallyValid(contextFrame);
  contextFrame.spec.synopsis = "s".repeat(321);
  assertStructurallyInvalid(contextFrame);
  contextFrame.spec.synopsis = "";
  assertStructurallyInvalid(contextFrame);
});

test("authored scalar wording cannot be whitespace-only", async (t) => {
  for (const field of ["subject", "purpose", "synopsis"]) {
    await t.test(field, () => {
      const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
      contextFrame.spec[field] = " \t\n";
      assertStructurallyInvalid(contextFrame);
    });
  }
});

test("included scope enforces 1 to 16 ordered boundaries", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.scope.included = Array.from(
    { length: 16 },
    (_, index) => `Included boundary ${index + 1}`
  );
  assertStructurallyValid(contextFrame);
  contextFrame.spec.scope.included.push("Included boundary 17");
  assertStructurallyInvalid(contextFrame);
  contextFrame.spec.scope.included = [];
  assertStructurallyInvalid(contextFrame);
});

test("excluded scope enforces 0 to 16 ordered boundaries", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.scope.excluded = Array.from(
    { length: 16 },
    (_, index) => `Excluded boundary ${index + 1}`
  );
  assertStructurallyValid(contextFrame);
  contextFrame.spec.scope.excluded.push("Excluded boundary 17");
  assertStructurallyInvalid(contextFrame);
});

test("scope boundaries enforce the exact 1 to 280 character bound", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.scope.included[0] = "b".repeat(280);
  assertStructurallyValid(contextFrame);
  contextFrame.spec.scope.included[0] = "b".repeat(281);
  assertStructurallyInvalid(contextFrame);
  contextFrame.spec.scope.included[0] = " \t";
  assertStructurallyInvalid(contextFrame);
});

test("givens enforce 0 to 24 ordered records", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.givens = Array.from({ length: 24 }, (_, index) => ({
    classification: "fact",
    text: `Given ${index + 1}`
  }));
  assertStructurallyValid(contextFrame);
  contextFrame.spec.givens.push({
    classification: "constraint",
    text: "Given 25"
  });
  assertStructurallyInvalid(contextFrame);
});

test("each given has an exact classification and 1 to 500 characters of text", async (t) => {
  for (const classification of ["fact", "assumption", "constraint"]) {
    await t.test(classification, () => {
      const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
      contextFrame.spec.givens = [{
        classification,
        text: "g".repeat(500)
      }];
      assertStructurallyValid(contextFrame);
    });
  }

  await t.test("unknown classification", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.givens = [{
      classification: "preference",
      text: "A preference is not a declared given classification."
    }];
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("text over 500 characters", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.givens = [{
      classification: "fact",
      text: "g".repeat(501)
    }];
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("whitespace-only text", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.givens = [{
      classification: "fact",
      text: "\n"
    }];
    assertStructurallyInvalid(contextFrame);
  });
});

test("given records require only classification and text", async (t) => {
  for (const field of ["classification", "text"]) {
    await t.test(`missing ${field}`, () => {
      const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
      delete contextFrame.spec.givens[0][field];
      assertStructurallyInvalid(contextFrame);
    });
  }

  await t.test("unknown field", () => {
    const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
    contextFrame.spec.givens[0].source = "implicit";
    assertStructurallyInvalid(contextFrame);
  });
});

test("terms enforce 0 to 16 ordered records", () => {
  const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
  contextFrame.spec.terms = Array.from({ length: 16 }, (_, index) => ({
    term: `term-${index + 1}`,
    meaning: `Meaning ${index + 1}`
  }));
  assertStructurallyValid(contextFrame);
  contextFrame.spec.terms.push({
    term: "term-17",
    meaning: "Meaning 17"
  });
  assertStructurallyInvalid(contextFrame);
});

test("term records enforce exact term and meaning bounds", async (t) => {
  await t.test("maximum valid bounds", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.terms = [{
      term: "t".repeat(80),
      meaning: "m".repeat(280)
    }];
    assertStructurallyValid(contextFrame);
  });

  await t.test("term over 80 characters", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.terms = [{
      term: "t".repeat(81),
      meaning: "Meaning"
    }];
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("meaning over 280 characters", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.terms = [{
      term: "term",
      meaning: "m".repeat(281)
    }];
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("whitespace-only term", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.terms = [{
      term: "\t",
      meaning: "Meaning"
    }];
    assertStructurallyInvalid(contextFrame);
  });

  await t.test("whitespace-only meaning", () => {
    const contextFrame = clone(readContextFrameExample("minimal-decision.context-frame.json"));
    contextFrame.spec.terms = [{
      term: "term",
      meaning: " "
    }];
    assertStructurallyInvalid(contextFrame);
  });
});

test("term records require only term and meaning", async (t) => {
  for (const field of ["term", "meaning"]) {
    await t.test(`missing ${field}`, () => {
      const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
      delete contextFrame.spec.terms[0][field];
      assertStructurallyInvalid(contextFrame);
    });
  }

  await t.test("unknown field", () => {
    const contextFrame = clone(readContextFrameExample("application-messaging.context-frame.json"));
    contextFrame.spec.terms[0].alias = "alternate";
    assertStructurallyInvalid(contextFrame);
  });
});
