import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("mismatched parent ancestry is rejected semantically", async () => {
  await runObligationScenario("O-SV03-02");
});
