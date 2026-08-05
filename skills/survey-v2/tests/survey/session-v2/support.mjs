import {
  mkdtemp,
  mkdir,
  readFile,
  rm,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  compileJournalIdentityPort,
} from "../../../source/authoring/runtime/journal-replay.mjs";
import {
  createSurveySessionJournalIdentityConfiguration,
} from "../../../source/authoring/survey/session-journal-identity.mjs";
import {
  CANDIDATE_V2_SELECTOR,
} from "../../../source/authoring/survey/session-semantics.mjs";
import {
  attachCandidateAuthoringPersistence,
  createCandidateSessionSkeleton,
  createSurveyGenesisWorkspace,
  surveyPolicyInput,
} from "../../../source/authoring/survey/session-root.mjs";
import {
  loadSurveyProfileAuthority,
} from "../../../source/authoring/survey/profile-authority.mjs";
import {
  buildSurveySourceSnapshot,
} from "../../../source/authoring/survey/source-snapshot.mjs";
import {
  buildSurveyPolicySnapshot,
} from "../../../source/authoring/survey/survey-policy-snapshot.mjs";

export const candidateSelector = CANDIDATE_V2_SELECTOR;
export const authenticationKey = Buffer.alloc(32, 0x41);
export const wrongAuthenticationKey = Buffer.alloc(32, 0x42);

export function sessionBytes(session) {
  return Buffer.from(`${JSON.stringify(session, null, 2)}\n`, "utf8");
}

export async function createCandidate({
  slug = "session-adapter-test",
  sessionId = "session-adapter-test-001",
} = {}) {
  const profileAuthority = await loadSurveyProfileAuthority();
  const sourceSnapshot = buildSurveySourceSnapshot([{
    logicalName: "intent.txt",
    bytes: Buffer.from(
      "Exercise the production Survey session adapter boundary.\n",
      "utf8",
    ),
  }]);
  const policySnapshot = buildSurveyPolicySnapshot(
    surveyPolicyInput(profileAuthority),
  );
  const workspace = createSurveyGenesisWorkspace({
    slug,
    profileAuthority,
    sourceSnapshot,
    policySnapshot,
  });
  const skeleton = createCandidateSessionSkeleton({
    slug,
    sessionId,
    profileAuthority,
    sourceSnapshot,
    policySnapshot,
    workspace,
    authority: {
      directorRef: "director.synthetic",
      proposerRef: "proposer.synthetic",
      bindingEvidence: "session-adapter-test",
    },
    axiomCorpus: false,
  });
  const identityConfiguration =
    createSurveySessionJournalIdentityConfiguration(
      skeleton,
      authenticationKey,
    );
  const session = attachCandidateAuthoringPersistence(
    skeleton,
    identityConfiguration,
  );
  return {
    identity: compileJournalIdentityPort(
      identityConfiguration,
    ),
    identityConfiguration,
    policySnapshot,
    profileAuthority,
    session,
    sourceSnapshot,
    workspace,
  };
}

export async function createPersistentCandidate(
  testContext,
  options = {},
) {
  const candidate = await createCandidate(options);
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-session-adapter-"),
  );
  const runDirectory = path.join(temporaryRoot, "run");
  await mkdir(runDirectory);
  await writeFile(
    path.join(runDirectory, "session.json"),
    sessionBytes(candidate.session),
    { flag: "wx" },
  );
  testContext.after(async () => {
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });
  return {
    ...candidate,
    runDirectory,
    sessionFile: path.join(runDirectory, "session.json"),
    temporaryRoot,
  };
}

export async function readSessionBytes(harness) {
  return readFile(harness.sessionFile);
}

export function readyDependencyResult(session) {
  return {
    status: "ready",
    resultDigest:
      session.dependencies.outputs.initResolve.resultDigest,
  };
}
