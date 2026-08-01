import {
  mkdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import {
  dirname,
  join,
} from "node:path";
import {
  HASH_PROFILE_ID,
  hashCanonical,
} from "../../source/executables/engine/index.mjs";
import {
  createSurveyV1SubjectAdapter,
  createSurveyV2SubjectAdapter,
} from "../../source/executables/orchestrator/index.mjs";

function eventRoot(sessionRef, ordinal) {
  return hashCanonical("subject-adapter-fixture-event/v1", {
    sessionRef,
    ordinal,
  });
}

function stateRoot(sessionRef, revision) {
  return hashCanonical("subject-adapter-fixture-state/v1", {
    sessionRef,
    revision,
  });
}

function observation(descriptor, {
  sessionRef = "fixture-session",
  revision = 0,
  terminalClass = "nonterminal",
  envelopeRef = null,
} = {}) {
  const eventRoots = Array.from(
    { length: revision },
    (_, index) => eventRoot(sessionRef, index + 1),
  );
  return {
    schemaVersion: "1.0.0",
    hashProfileId: HASH_PROFILE_ID,
    adapterId: descriptor.adapterId,
    adapterInterfaceVersion: descriptor.adapterInterfaceVersion,
    sessionRef,
    phase: terminalClass === "nonterminal" ? "questions" : terminalClass,
    revision,
    subjectStateRoot: stateRoot(sessionRef, revision),
    eventRoots,
    terminalClass,
    directorView:
      terminalClass === "nonterminal"
        ? { presentationClass: "one-question", questionId: "q1" }
        : null,
    envelopeRef,
  };
}

function runtimeCore(descriptor, {
  terminalClass = "nonterminal",
  envelopeRef = null,
} = {}) {
  let current = observation(descriptor, {
    terminalClass,
    envelopeRef,
  });
  return {
    initialize: async () => current,
    observe: async () => current,
    action: async (request) => {
      current = observation(descriptor, {
        sessionRef: request.sessionRef,
        revision: current.revision + 1,
        terminalClass,
        envelopeRef,
      });
      return {
        actionId: request.actionId,
        accepted: true,
        eventRoot: current.eventRoots.at(-1),
        observation: current,
      };
    },
    coldResume: async () => current,
    current: () => current,
  };
}

export function makeV1Adapter(options = {}) {
  let runtime;
  const adapter = createSurveyV1SubjectAdapter({
    initializeClassicSurvey: async (request) =>
      runtime.initialize(request),
    inspectClassicSurvey: async (request) =>
      runtime.observe(request),
    submitClassicDirectorAction: async (request) =>
      runtime.action(request),
    rehydrateClassicSurvey: async (request) =>
      runtime.coldResume(request),
  });
  runtime = runtimeCore(adapter.describe(), options);
  return { adapter, runtime };
}

export function makeV2Adapter(options = {}) {
  let runtime;
  const adapter = createSurveyV2SubjectAdapter({
    initializeProtocolSession: async (request) =>
      runtime.initialize(request),
    queryProtocolSession: async (request) =>
      runtime.observe(request),
    dispatchProtocolDirectorAction: async (request) =>
      runtime.action(request),
    coldResumeProtocolSession: async (request) =>
      runtime.coldResume(request),
  });
  runtime = runtimeCore(adapter.describe(), options);
  return { adapter, runtime };
}

export function makeArtifactProducingV1Adapter() {
  const sessions = new Map();
  const invocations = [];
  let descriptor;
  const observedState = (session) => {
    const eventRoots = Array.from(
      { length: session.revision },
      (_, index) => eventRoot(session.sessionRef, index + 1),
    );
    return {
      schemaVersion: "1.0.0",
      hashProfileId: HASH_PROFILE_ID,
      adapterId: descriptor.adapterId,
      adapterInterfaceVersion: descriptor.adapterInterfaceVersion,
      sessionRef: session.sessionRef,
      phase: session.revision === 0 ? "question" : "completed",
      revision: session.revision,
      subjectStateRoot: stateRoot(session.sessionRef, session.revision),
      eventRoots,
      terminalClass:
        session.revision === 0 ? "nonterminal" : "completed",
      directorView:
        session.revision === 0
          ? {
              presentationClass: "one-question",
              questionId: "fixture-question",
            }
          : null,
      envelopeRef: session.envelopeRef,
    };
  };
  const adapter = createSurveyV1SubjectAdapter({
    initializeClassicSurvey: async (request) => {
      invocations.push({
        method: "initialize",
        attemptId: request.attemptId,
      });
      const sessionRef = request.attemptId;
      if (!sessions.has(sessionRef)) {
        const capabilities = JSON.parse(
          await readFile(
            join(request.stagedSkillRoot, "fixture-capabilities.json"),
            "utf8",
          ),
        );
        sessions.set(sessionRef, {
          sessionRef,
          revision: 0,
          artifactDestination: request.artifactDestination,
          capabilities,
          envelopeRef: null,
        });
      }
      return observedState(sessions.get(sessionRef));
    },
    inspectClassicSurvey: async (request) => {
      invocations.push({ method: "observe", sessionRef: request.sessionRef });
      return observedState(sessions.get(request.sessionRef));
    },
    submitClassicDirectorAction: async (request) => {
      invocations.push({
        method: "action",
        sessionRef: request.sessionRef,
        actionClass: request.directorAction.actionClass,
      });
      const session = sessions.get(request.sessionRef);
      if (
        session.revision !== 0 ||
        request.expectedStateRoot !== stateRoot(session.sessionRef, 0)
      ) {
        throw new Error("fixture Survey subject received a stale action");
      }
      const sections = [
        ["summary", session.capabilities.capabilities?.summary],
        ["risk", session.capabilities.capabilities?.risk],
        ["next-step", session.capabilities.capabilities?.nextStep],
      ]
        .filter(([, text]) => typeof text === "string" && text.length > 0)
        .map(([sectionId, text]) => ({ sectionId, text }));
      const artifact = {
        artifactId: `${request.sessionRef}:survey-artifact`,
        title: "Adapter-produced blind survey artifact",
        sections,
      };
      await mkdir(dirname(session.artifactDestination), {
        recursive: true,
        mode: 0o700,
      });
      await writeFile(
        session.artifactDestination,
        `${JSON.stringify(artifact)}\n`,
        { encoding: "utf8", mode: 0o600, flag: "wx" },
      );
      session.revision = 1;
      session.envelopeRef = hashCanonical(
        "subject-adapter-fixture-envelope/v1",
        artifact,
      );
      const current = observedState(session);
      return {
        actionId: request.actionId,
        accepted: true,
        eventRoot: current.eventRoots.at(-1),
        observation: current,
      };
    },
    rehydrateClassicSurvey: async (request) => {
      invocations.push({
        method: "coldResume",
        sessionRef: request.sessionRef,
      });
      return observedState(sessions.get(request.sessionRef));
    },
  });
  descriptor = adapter.describe();
  return { adapter, invocations, sessions };
}

export function initializationRequest() {
  return {
    attemptId: "attempt-1",
    stagedSkillRoot: "/isolated/skills/survey",
    publicScenario: { scenarioId: "scenario-1" },
    artifactDestination: "/isolated/artifacts/survey.md",
  };
}

export function actionRequest(subjectStateRoot, actionClass = "ratify") {
  return {
    sessionRef: "fixture-session",
    actionId: "action-1",
    expectedStateRoot: subjectStateRoot,
    directorAction: {
      actionClass,
      payload: { decision: "confirm" },
    },
  };
}

export { observation, stateRoot };
