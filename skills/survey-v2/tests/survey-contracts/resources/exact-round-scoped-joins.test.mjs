import test from "node:test";
import { runObligationScenario } from "../support/obligation-scenarios.mjs";

test("same-ordinal resources cannot cross exact Round or Survey lineage", async () => {
  await runObligationScenario("O-SV01-03");
});
