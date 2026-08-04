#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import {
  admitFrozenPackage,
  FrozenPackageRequiredError,
  verifyFrozenPackageRoot
} from "./package-compatibility.mjs";

function options(argv) {
  const result = new Map();
  for (const argument of argv) {
    const match = argument.match(/^--([a-z-]+)=(.+)$/u);
    if (!match || result.has(match[1])) {
      throw new TypeError("options must be unique --name=value arguments");
    }
    result.set(match[1], match[2]);
  }
  for (const name of ["run-directory", "subject-root"]) {
    if (!result.has(name)) throw new TypeError(`--${name} is required`);
  }
  for (const name of result.keys()) {
    if (!["required-package", "run-directory", "subject-root"].includes(name)) {
      throw new TypeError(`unknown option --${name}`);
    }
  }
  return result;
}

function absolute(value, label) {
  if (!path.isAbsolute(value)) throw new TypeError(`${label} must be absolute`);
  return path.normalize(value);
}

try {
  const parsed = options(process.argv.slice(2));
  const subjectRoot = absolute(parsed.get("subject-root"), "subject root");
  const runDirectory = absolute(parsed.get("run-directory"), "run directory");
  const requiredSource = parsed.has("required-package")
    ? JSON.parse(
        await readFile(
          absolute(parsed.get("required-package"), "required package path"),
          "utf8"
        )
      )
    : JSON.parse(
        await readFile(new URL("./protocol-v1.freeze.json", import.meta.url), "utf8")
      );
  const requiredPackage =
    requiredSource.compatibilityPolicy?.requiredPackage ?? requiredSource;
  const verifiedPackage = await verifyFrozenPackageRoot({
    subjectRoot,
    requiredPackage
  });
  const session = JSON.parse(
    await readFile(path.join(runDirectory, "session.json"), "utf8")
  );
  const admission = admitFrozenPackage({
    session,
    verifiedPackage,
    requiredPackage
  });

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
  const host = {
    role: "host",
    ref: "survey-v2-baseline-freeze",
    assertionSource: "host-adapter:characterization-preflight"
  };
  let resumed = await engine.applySurveyCommand(
    verifiedPackage.root,
    runDirectory,
    {
      event: "PROCESS_START",
      eventId: "baseline-freeze:process-start",
      expectedRevision: session.revision,
      payload: {}
    },
    host
  );
  resumed = await engine.applySurveyCommand(
    verifiedPackage.root,
    runDirectory,
    {
      event: "REHYDRATION_PASS",
      eventId: "baseline-freeze:rehydration-pass",
      expectedRevision: resumed.session.revision,
      payload: {}
    },
    host
  );
  process.stdout.write(
    `${JSON.stringify({
      admission,
      ok: true,
      resumed: {
        phase: resumed.session.phase,
        revision: resumed.session.revision,
        runtimeStatus: resumed.session.runtimeStatus,
        viewDigest: resumed.session.outbox?.digest ?? null
      },
      verifiedMemberCount: verifiedPackage.registeredMemberCount
    })}\n`
  );
} catch (error) {
  const code =
    error instanceof FrozenPackageRequiredError
      ? error.code
      : "PREFLIGHT_INVALID";
  process.stderr.write(
    `${JSON.stringify({ code, message: error.message, ok: false })}\n`
  );
  process.exitCode = error instanceof FrozenPackageRequiredError ? 65 : 64;
}
