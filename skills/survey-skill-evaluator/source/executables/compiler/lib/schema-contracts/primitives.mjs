import { HASH_PROFILE_ID } from "../hash.mjs";

export const SCHEMA_VERSION = {
  type: "string",
  pattern: "^\\d+\\.\\d+\\.\\d+$",
};

export const ID_PATTERN = "^[A-Za-z0-9][A-Za-z0-9._:/-]{0,255}$";
export const DIGEST_PATTERN = "^[a-f0-9]{64}$";

export const identifier = () => ({ type: "string", pattern: ID_PATTERN });
export const digest = () => ({ type: "string", pattern: DIGEST_PATTERN });
export const text = () => ({ type: "string", minLength: 1, maxLength: 4000 });
export const nonNegativeInteger = () => ({ type: "integer", minimum: 0 });
export const positiveInteger = () => ({ type: "integer", minimum: 1 });
export const probability = () => ({
  type: "number",
  minimum: 0,
  maximum: 1,
});
export const identifierArray = (extra = {}) => ({
  type: "array",
  items: identifier(),
  uniqueItems: true,
  ...extra,
});
export const digestArray = (extra = {}) => ({
  type: "array",
  items: digest(),
  uniqueItems: true,
  ...extra,
});
export const textArray = (extra = {}) => ({
  type: "array",
  items: text(),
  uniqueItems: true,
  ...extra,
});

export function closed(properties, required = Object.keys(properties), extra = {}) {
  return {
    type: "object",
    additionalProperties: false,
    properties,
    required,
    ...extra,
  };
}

export function nullable(schema) {
  return { anyOf: [schema, { type: "null" }] };
}

export function contract(properties, required = Object.keys(properties), extra = {}) {
  return closed(
    {
      schemaVersion: SCHEMA_VERSION,
      hashProfileId: { const: HASH_PROFILE_ID },
      ...properties,
    },
    ["schemaVersion", "hashProfileId", ...required],
    extra,
  );
}

export function identifiedContract(
  idField,
  properties,
  required = Object.keys(properties),
  extra = {},
) {
  return contract(
    {
      [idField]: identifier(),
      ...properties,
    },
    [idField, ...required],
    extra,
  );
}

export function discriminated(discriminator, branches, common = {}) {
  return {
    oneOf: Object.entries(branches).map(([tag, branch]) => {
      const properties = {
        ...common,
        [discriminator]: { const: tag },
        ...branch.properties,
      };
      return closed(properties, [
        ...Object.keys(common),
        discriminator,
        ...(branch.required ?? Object.keys(branch.properties)),
      ]);
    }),
  };
}

export function predecessor() {
  return discriminated("kind", {
    existing: {
      properties: {
        objectId: identifier(),
        revision: nonNegativeInteger(),
        authoritativeStateRoot: digest(),
      },
    },
    absent: {
      properties: {
        machineId: identifier(),
        objectId: identifier(),
        schemaVersion: SCHEMA_VERSION,
        absentSentinel: digest(),
      },
    },
    parent_staged_genesis: {
      properties: {
        genesisRecordDigest: digest(),
        initialSemanticCoreDigest: digest(),
        initialAuthoritativeStateRoot: digest(),
      },
    },
  });
}

export function lifecycleStates(lifecycleManifest, machineId) {
  const tuples = lifecycleManifest?.machines?.[machineId];
  if (!Array.isArray(tuples) || tuples.length === 0) {
    throw new Error(
      `sovereign state contract requires lifecycle machine: ${machineId}`,
    );
  }
  const states = [];
  for (const encoded of tuples) {
    if (typeof encoded !== "string") {
      throw new Error(`lifecycle tuple for ${machineId} is not compact text`);
    }
    const tuple = encoded.split("|");
    if (tuple.length !== 4) {
      throw new Error(`lifecycle tuple for ${machineId} is malformed`);
    }
    for (const state of tuple.slice(2)) {
      if (
        state !== "[*]" &&
        state !== "same" &&
        !states.includes(state)
      ) {
        states.push(state);
      }
    }
  }
  if (states.length === 0) {
    throw new Error(`lifecycle machine has no concrete states: ${machineId}`);
  }
  return states;
}

export function stateContract({
  idField,
  machineId,
  lifecycleManifest,
  properties = {},
  required = Object.keys(properties),
  extra = {},
}) {
  return identifiedContract(
    idField,
    {
      machineId: { const: machineId },
      revision: nonNegativeInteger(),
      state: { enum: lifecycleStates(lifecycleManifest, machineId) },
      predecessor: predecessor(),
      eventRefs: digestArray(),
      outboxRefs: digestArray(),
      ...properties,
    },
    [
      "machineId",
      "revision",
      "state",
      "predecessor",
      "eventRefs",
      "outboxRefs",
      ...required,
    ],
    extra,
  );
}

export const immutableEvidence = () => ({
  immutable: { const: true },
  evidenceRefs: digestArray(),
});

export const attestation = () =>
  closed({
    authorityId: identifier(),
    statementDigest: digest(),
    signature: text(),
  });

export const countLedger = (countNames) =>
  closed(
    Object.fromEntries(countNames.map((name) => [name, nonNegativeInteger()])),
  );
