import {
  spawn,
} from "node:child_process";
import {
  chmod,
  mkdir,
  mkdtemp,
  readFile,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  fileURLToPath,
} from "node:url";
import {
  renderPopulatedTextForm,
  textContentBytes,
} from "../../../source/authoring/kernel/text-forms.mjs";
import {
  loadSurveyProfileAuthority,
} from "../../../source/authoring/survey/profile-authority.mjs";
import {
  executeSurveyctlCommand,
  initializeSurveyctlRun,
} from "../../../source/executables/runtime/lib/surveyctl-engine.mjs";
import {
  roundOneQuestionFrameValues,
} from "../round-one-question-frames/support.mjs";
import {
  roundOneQuestionValues,
} from "../round-one-questions/support.mjs";

export const surveyctlSource = fileURLToPath(
  new URL(
    "../../../scripts/surveyctl.mjs",
    import.meta.url,
  ),
);

export function surveyFrameValues() {
  return {
    subject: "Surveyctl production boundary",
    purpose:
      "Capture exact stakeholder intent for a durable Survey-v2 authoring run.",
    "outcome-axes": ["authority", "determinism"],
    "scope-included": ["SurveyFrame authoring"],
    synopsis:
      "Define the Survey boundary before round authoring begins.",
  };
}

export function roundOneFrameValues() {
  return {
    subject: "Foundation production boundary",
    purpose:
      "Establish initial Director priorities before refinement.",
    "scope-included": [
      "Primary intent dimensions",
      "Initial trade-off preferences",
    ],
    "scope-excluded": ["Round 2 disambiguation"],
    givens: [
      "fact | Round 1 contains exactly three questions.",
    ],
    synopsis:
      "Establish initial intent dimensions and priority trade-offs.",
    terms: [
      "priority | The relative importance of an outcome axis.",
    ],
    "scope-relation": "narrows",
    "containment-rationale":
      "The Round selects initial dimensions inside the authored Survey boundary.",
  };
}

export async function createSurveyctlHarness(
  testContext,
  {
    slug = "surveyctl-test",
  } = {},
) {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "survey-v2-surveyctl-"),
  );
  const sessionsRoot = path.join(temporaryRoot, "sessions");
  const sourceRoot = path.join(temporaryRoot, "source");
  const keyRoot = path.join(temporaryRoot, "keys");
  await Promise.all([
    mkdir(sessionsRoot),
    mkdir(sourceRoot),
    mkdir(keyRoot, { mode: 0o700 }),
  ]);
  const sourceFile = path.join(sourceRoot, "intent.txt");
  await writeFile(
    sourceFile,
    "Design a precise context-framed Survey authoring workflow.\n",
    { flag: "wx" },
  );
  testContext.after(async () => {
    await rm(temporaryRoot, {
      recursive: true,
      force: true,
    });
  });
  const initOptions = Object.freeze({
    command: "init",
    format: "json",
    slug,
    sessionsRoot,
    sourceRoot,
    sources: Object.freeze(["intent.txt"]),
    authority: Object.freeze({
      directorRef: "director.synthetic",
      proposerRef: "proposer.synthetic",
      bindingEvidence: "surveyctl-v2-test",
    }),
    axiomCorpus: false,
    keyRoot,
  });
  return {
    initOptions,
    keyRoot,
    sessionsRoot,
    sourceFile,
    sourceRoot,
    temporaryRoot,
  };
}

export async function initializeHarness(harness) {
  const initialized = await initializeSurveyctlRun(
    harness.initOptions,
  );
  return {
    ...harness,
    initialized,
    runDirectory: initialized.runDirectory,
    sessionFile: path.join(
      initialized.runDirectory,
      "session.json",
    ),
  };
}

export function commandOptions(
  harness,
  command,
  additions = {},
) {
  return {
    command,
    format: "json",
    runDirectory: harness.runDirectory,
    keyRoot: harness.keyRoot,
    ...additions,
  };
}

export async function executeCommand(
  harness,
  command,
  additions = {},
) {
  return executeSurveyctlCommand(
    commandOptions(harness, command, additions),
  );
}

export async function readSessionBytes(harness) {
  return readFile(harness.sessionFile);
}

export async function readSession(harness) {
  return JSON.parse(
    await readFile(harness.sessionFile, "utf8"),
  );
}

export async function populatedSurveyFrameBytes(
  pending,
) {
  const authority = await loadSurveyProfileAuthority();
  const formBinding =
    authority.profile.spec.formBindings.find(
      (binding) =>
        binding.id === pending.request.spec.bindings.form.id,
    );
  const formDefinition =
    authority.forms.find(
      (form) =>
        form.metadata.name ===
          formBinding?.definition?.name,
    );
  if (!formDefinition) {
    throw new Error(
      "test harness could not resolve the pending Survey form",
    );
  }
  const projectedClosure = structuredClone(
    pending.contextClosure,
  );
  const intake = projectedClosure.spec.layers.find(
    (layer) => layer.role === "intake",
  );
  const inventory = intake?.selectedValue?.[0]?.value;
  if (!Array.isArray(inventory)) {
    throw new Error(
      "test harness could not resolve the intake inventory",
    );
  }
  intake.selectedValue = [{
    path: "/spec/inventory",
    value: {
      documents: inventory.map((entry) => ({
        ordinal: entry.ordinal,
        logicalName: entry.logicalName,
        text: textContentBytes(entry.content).toString("utf8"),
      })),
    },
  }];
  return renderPopulatedTextForm({
    formDefinition,
    contextClosure: projectedClosure,
    requestHandle: pending.assignment.spec.handle,
    values: surveyFrameValues(),
  });
}

export async function writeSurveyFrameInput(
  harness,
  pending,
) {
  const input = path.join(
    harness.temporaryRoot,
    "survey-frame.txt",
  );
  await writeFile(
    input,
    await populatedSurveyFrameBytes(pending),
    { flag: "wx" },
  );
  return input;
}

export async function populatedRoundOneFrameBytes(
  pending,
) {
  const authority = await loadSurveyProfileAuthority();
  const formBinding =
    authority.profile.spec.formBindings.find(
      (binding) =>
        binding.id === pending.request.spec.bindings.form.id,
    );
  const formDefinition =
    authority.forms.find(
      (form) =>
        form.metadata.name ===
          formBinding?.definition?.name,
    );
  if (!formDefinition) {
    throw new Error(
      "test harness could not resolve the pending Round 1 form",
    );
  }
  return renderPopulatedTextForm({
    formDefinition,
    contextClosure: pending.contextClosure,
    requestHandle: pending.assignment.spec.handle,
    values: roundOneFrameValues(),
  });
}

export async function writeRoundOneFrameInput(
  harness,
  pending,
) {
  const input = path.join(
    harness.temporaryRoot,
    "round-one-frame.txt",
  );
  await writeFile(
    input,
    await populatedRoundOneFrameBytes(pending),
    { flag: "wx" },
  );
  return input;
}

export async function populatedRoundOneQuestionFramesBytes(
  pending,
) {
  const authority = await loadSurveyProfileAuthority();
  const formBinding =
    authority.profile.spec.formBindings.find(
      (binding) =>
        binding.id === pending.request.spec.bindings.form.id,
    );
  const formDefinition =
    authority.forms.find(
      (form) =>
        form.metadata.name === formBinding?.definition?.name,
    );
  if (!formDefinition) {
    throw new Error(
      "test harness could not resolve the pending QuestionFrame form",
    );
  }
  return renderPopulatedTextForm({
    formDefinition,
    contextClosure: pending.contextClosure,
    requestHandle: pending.assignment.spec.handle,
    values: roundOneQuestionFrameValues(),
  });
}

export async function writeRoundOneQuestionFramesInput(
  harness,
  pending,
) {
  const input = path.join(
    harness.temporaryRoot,
    "round-one-question-frames.txt",
  );
  await writeFile(
    input,
    await populatedRoundOneQuestionFramesBytes(pending),
    { flag: "wx" },
  );
  return input;
}

export async function populatedRoundOneQuestionsBytes(
  pending,
) {
  const authority = await loadSurveyProfileAuthority();
  const formBinding =
    authority.profile.spec.formBindings.find(
      (binding) =>
        binding.id === pending.request.spec.bindings.form.id,
    );
  const formDefinition =
    authority.forms.find(
      (form) =>
        form.metadata.name === formBinding?.definition?.name,
    );
  if (!formDefinition) {
    throw new Error(
      "test harness could not resolve the pending Question-set form",
    );
  }
  return renderPopulatedTextForm({
    formDefinition,
    contextClosure: pending.contextClosure,
    requestHandle: pending.assignment.spec.handle,
    values: roundOneQuestionValues(),
  });
}

export async function writeRoundOneQuestionsInput(
  harness,
  pending,
) {
  const input = path.join(
    harness.temporaryRoot,
    "round-one-questions.txt",
  );
  await writeFile(
    input,
    await populatedRoundOneQuestionsBytes(pending),
    { flag: "wx" },
  );
  return input;
}

export async function secureKeyFile(
  keyRoot,
  fileName,
  bytes,
) {
  await mkdir(keyRoot, { mode: 0o700, recursive: true });
  await chmod(keyRoot, 0o700);
  const target = path.join(keyRoot, fileName);
  await writeFile(target, bytes, {
    flag: "wx",
    mode: 0o600,
  });
  await chmod(target, 0o600);
  return target;
}

export async function mode(target) {
  return (await stat(target)).mode & 0o777;
}

export function runSurveyctlProcess(args, {
  stdin,
} = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [surveyctlSource, ...args],
      {
        env: {
          ...process.env,
          NO_COLOR: "1",
        },
        stdio: ["pipe", "pipe", "pipe"],
      },
    );
    const stdout = [];
    const stderr = [];
    child.stdout.on("data", (chunk) => stdout.push(chunk));
    child.stderr.on("data", (chunk) => stderr.push(chunk));
    child.once("error", reject);
    child.once("close", (code, signal) => {
      resolve({
        code,
        signal,
        stdout: Buffer.concat(stdout),
        stderr: Buffer.concat(stderr),
      });
    });
    if (stdin === undefined) child.stdin.end();
    else child.stdin.end(stdin);
  });
}
