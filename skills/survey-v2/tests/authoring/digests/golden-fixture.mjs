import { readFile } from "node:fs/promises";

export const goldenDigestFixture = JSON.parse(
  await readFile(new URL("./authoring-digests.v1.golden.json", import.meta.url), "utf8")
);
