import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("GenerationRecord binds the exact Request, Assignment, Submission, created results, and ancestry", async () => {
  await runObligationScenario("O-AS14-21");
});
