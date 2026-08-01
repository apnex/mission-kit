import {
  appendAcceptedEvent,
  sealSession
} from "../../source/executables/runtime/lib/storage.mjs";

export function minimalSession() {
  const session = {
    $schema: "urn:mission-kit:survey-v2:schema:session-state:v1",
    schemaVersion: "1.0.0",
    revision: 0,
    phase: "initialized",
    runtimeStatus: "active",
    events: [],
    snapshotDigest: "sha256:".padEnd(71, "0")
  };
  appendAcceptedEvent(session, {
    id: "event-1",
    eventId: "FIXTURE_EVENT",
    transitionId: "T00",
    actor: { role: "host", ref: "fixture", assertionSource: "test-host" },
    payload: {}
  });
  return sealSession(session);
}
