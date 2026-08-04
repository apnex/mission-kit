#!/usr/bin/env node

import {
  cp,
  mkdtemp,
  readFile,
  rm,
  writeFile
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { prettyJson } from "../../source/executables/runtime/lib/canonical.mjs";
import {
  admitFrozenPackage,
  FrozenPackageRequiredError,
  verifyFrozenPackageRoot
} from "./package-compatibility.mjs";

const argument = process.argv.slice(2).find((value) => value.startsWith("--subject-root="));
if (!argument) {
  process.stderr.write("usage: export-representative-sessions.mjs --subject-root=/absolute/path\n");
  process.exit(64);
}
const subjectArgument = argument.slice("--subject-root=".length);
if (!path.isAbsolute(subjectArgument)) throw new TypeError("subject root must be absolute");
const subjectRoot = path.normalize(subjectArgument);
const requiredProjectionDigest =
  "sha256:6603b777b82783176fca6129bfecde7a6e253f5be86f9becf94703d818b9757c";
const requiredPackage = {
  id: "urn:mission-kit:survey-v2:package:survey-v2",
  version: "1.0.0",
  projectionDigest: requiredProjectionDigest,
  protocolDigest:
    "sha256:d99054ceba9e72ad3787ef038b41184b70968e6e4e444b67178b7328542d515a"
};
const verifiedPackage = await verifyFrozenPackageRoot({
  subjectRoot,
  requiredPackage
});
const fixture = await import(
  pathToFileURL(
    path.join(
      verifiedPackage.root,
      "tests",
      "fixtures",
      "runtime-fixture.mjs"
    )
  ).href
);
const engine = await import(
  pathToFileURL(
    path.join(
      verifiedPackage.root,
      "source",
      "executables",
      "runtime",
      "lib",
      "engine.mjs"
    )
  ).href
);
const runs = [];
let changedTemporary = null;
try {
  const initialized = await fixture.newRun();
  runs.push(initialized);
  admitFrozenPackage({
    session: initialized.session,
    verifiedPackage,
    requiredPackage
  });

  const awaitingQ1 = await fixture.newRun();
  runs.push(awaitingQ1);
  await fixture.reachAwaitingQ1(awaitingQ1);
  admitFrozenPackage({
    session: awaitingQ1.session,
    verifiedPackage,
    requiredPackage
  });
  await fixture.transition(awaitingQ1, {
    event: "PROCESS_START",
    eventId: "baseline-freeze:process-start",
    actor: fixture.host()
  });
  await fixture.transition(awaitingQ1, {
    event: "REHYDRATION_PASS",
    eventId: "baseline-freeze:rehydration-pass",
    actor: fixture.host()
  });

  const awaitingRatification = await fixture.newRun();
  runs.push(awaitingRatification);
  await fixture.reachAwaitingRatification(awaitingRatification);
  admitFrozenPackage({
    session: awaitingRatification.session,
    verifiedPackage,
    requiredPackage
  });

  const intentCaptured = await fixture.newRun();
  runs.push(intentCaptured);
  await fixture.reachAwaitingRatification(intentCaptured);
  const candidate = intentCaptured.session.candidates[0];
  await fixture.transition(intentCaptured, {
    event: "DIRECTOR_RATIFY",
    eventId: "baseline-freeze:ratify",
    actor: fixture.director(),
    payload: {
      semanticDigest: candidate.semanticDigest,
      renderDigest: candidate.renderDigest,
      acknowledgedViewDigest: intentCaptured.session.outbox.digest
    }
  });
  const finalized = await engine.finalizeSurveyEnvelope(
    subjectRoot,
    intentCaptured.runDirectory,
    {
      eventIdPrefix: "baseline-freeze",
      expectedRevision: intentCaptured.session.revision
    }
  );
  intentCaptured.session = finalized.session;
  const envelope = await readFile(
    path.join(intentCaptured.runDirectory, intentCaptured.session.finalization.targetPath),
    "utf8"
  );

  let mismatch;
  changedTemporary = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-protocol-v1-change-")
  );
  const changedRoot = path.join(changedTemporary, "subject");
  await cp(verifiedPackage.root, changedRoot, {
    recursive: true,
    dereference: false,
    filter(source) {
      const relative = path.relative(verifiedPackage.root, source);
      if (relative === "") return true;
      const first = relative.split(path.sep)[0];
      return ![".git", "node_modules", "surveys"].includes(first);
    }
  });
  const changedEngine = path.join(
    changedRoot,
    "source",
    "executables",
    "runtime",
    "lib",
    "engine.mjs"
  );
  await writeFile(
    changedEngine,
    `${await readFile(changedEngine, "utf8")}\n// changed-package characterization\n`
  );
  try {
    await verifyFrozenPackageRoot({
      subjectRoot: changedRoot,
      requiredPackage
    });
    throw new Error("changed package was unexpectedly admitted");
  } catch (error) {
    if (!(error instanceof FrozenPackageRequiredError)) throw error;
    mismatch = {
      code: error.code,
      refusedBeforeAlteredRuntimeImport: true,
      staleProjectionLockRejected: true
    };
  }

  process.stdout.write(prettyJson({
    schemaVersion: "1.0.0",
    kind: "ProtocolV1RepresentativeSessions",
    compatibility: {
      exactMatchResumed: true,
      verifiedMemberCount: verifiedPackage.registeredMemberCount,
      mismatch
    },
    requiredProjectionDigest,
    sessions: {
      initialized: initialized.session,
      round_1_q1_awaiting: awaitingQ1.session,
      awaiting_ratification: awaitingRatification.session,
      intent_captured: {
        envelope,
        session: intentCaptured.session
      }
    }
  }));
} finally {
  await Promise.all(runs.map((run) => run.cleanup()));
  if (changedTemporary !== null) {
    await rm(changedTemporary, { recursive: true, force: true });
  }
}
