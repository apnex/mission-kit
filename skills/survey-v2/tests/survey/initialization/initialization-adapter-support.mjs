export function digest(character) {
  return `sha256:${character.repeat(64)}`;
}

export function inertInitializationBoundary(
  storeId = "inert-survey-initialization",
) {
  const store = {
    commitRevision: 0,
    workspace: {
      spec: {
        authoringState: "new",
        openAssignment: null,
        resourceVersions: [],
      },
    },
    journal: [],
  };
  const calls = {
    read: 0,
    execute: 0,
    machineStateDigest: 0,
  };
  return {
    calls,
    store,
    ports: {
      coordinator: {
        async read() {
          calls.read += 1;
          throw new Error(
            "non-ready initialization must not read",
          );
        },
        async execute() {
          calls.execute += 1;
          throw new Error(
            "non-ready initialization must not execute",
          );
        },
      },
      identity: {
        machineStateDigest() {
          calls.machineStateDigest += 1;
          throw new Error(
            "non-ready initialization must not derive a machine state",
          );
        },
      },
      storeId,
    },
  };
}

export function initializationAuthority(suffix) {
  return {
    directorRef: `director.${suffix}`,
    proposerRef: `proposer.${suffix}`,
    bindingEvidence: `host-adapter:${suffix}`,
  };
}
