import assert from "node:assert/strict";
import test from "node:test";
import {
  createSurveyInitializationAdapter,
} from "../../../source/authoring/survey/initialization-adapter.mjs";

function poisonPorts(observations) {
  return new Proxy(
    {},
    {
      getOwnPropertyDescriptor() {
        observations.capabilityReads += 1;
        throw new Error(
          "capabilities must not be inspected before authority admission",
        );
      },
      getPrototypeOf() {
        observations.capabilityReads += 1;
        throw new Error(
          "capabilities must not be inspected before authority admission",
        );
      },
      ownKeys() {
        observations.capabilityReads += 1;
        throw new Error(
          "capabilities must not be inspected before authority admission",
        );
      },
    },
  );
}

test(
  "invalid Director proposer or binding refs reject before capability inspection",
  () => {
    const invalidAuthorities = [
      {},
      {
        directorRef: "",
        proposerRef: "proposer",
        bindingEvidence: "host-adapter:test",
      },
      {
        directorRef: "director",
        proposerRef: "",
        bindingEvidence: "host-adapter:test",
      },
      {
        directorRef: "director",
        proposerRef: "proposer",
        bindingEvidence: "",
      },
      {
        directorRef: 1,
        proposerRef: "proposer",
        bindingEvidence: "host-adapter:test",
      },
      {
        directorRef: "director",
        proposerRef: null,
        bindingEvidence: "host-adapter:test",
      },
      {
        directorRef: "director",
        proposerRef: "proposer",
        bindingEvidence: "host-adapter:test",
        ambient: "forbidden",
      },
    ];

    for (const authority of invalidAuthorities) {
      const observations = { capabilityReads: 0 };
      assert.throws(
        () =>
          createSurveyInitializationAdapter(
            authority,
            poisonPorts(observations),
          ),
        (error) =>
          error.code ===
            "SURVEY_INITIALIZATION_AUTHORITY_INVALID",
      );
      assert.equal(observations.capabilityReads, 0);
    }
  },
);
