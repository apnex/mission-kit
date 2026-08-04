#!/usr/bin/env node
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  negativeFaults,
  positiveResources
} from "./fixture-factory.mjs";

const supportRoot = path.dirname(fileURLToPath(import.meta.url));
const fixtureRoot = path.resolve(
  supportRoot,
  "../../fixtures/survey/contracts"
);
const positiveRoot = path.join(fixtureRoot, "positive");
const negativeRoot = path.join(fixtureRoot, "negative");

await Promise.all([
  mkdir(positiveRoot, { recursive: true }),
  mkdir(negativeRoot, { recursive: true })
]);

for (const [name, resource] of Object.entries(positiveResources)) {
  await writeFile(
    path.join(positiveRoot, `${name}.json`),
    `${JSON.stringify(resource, null, 2)}\n`,
    "utf8"
  );
}

for (const [name, fault] of Object.entries(negativeFaults)) {
  await writeFile(
    path.join(negativeRoot, `${name}.json`),
    `${JSON.stringify(fault, null, 2)}\n`,
    "utf8"
  );
}
