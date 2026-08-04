import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("every SurveyRuntimeArtifact variant binds its run, event, phase, revision, and source digest", async () => {
  await runObligationScenario("O-SV13-02");
});
