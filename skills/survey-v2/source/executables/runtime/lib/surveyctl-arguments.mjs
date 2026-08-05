import path from "node:path";
import { types } from "node:util";

export const SURVEYCTL_COMMANDS = Object.freeze([
  "init",
  "next",
  "submit",
  "status",
  "tree",
  "show",
  "validate",
]);

const commandSet = new Set(SURVEYCTL_COMMANDS);
const slugPattern = /^[a-z0-9][a-z0-9-]{0,79}$/u;
const optionKeyPattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/u;
const targetPattern =
  /^[A-Za-z0-9][A-Za-z0-9._:/-]{0,511}$/u;
const sourcePattern =
  /^[A-Za-z0-9._-]+(?:\/[A-Za-z0-9._-]+)*$/u;
const formatSet = new Set(["text", "json"]);
const commonOptions = Object.freeze([
  "format",
  "key-root",
  "journal-key-file",
]);
const commandOptions = Object.freeze({
  init: Object.freeze([
    ...commonOptions,
    "sessions-root",
    "source-root",
    "source",
    "director-ref",
    "proposer-ref",
    "binding-evidence",
    "axiom-corpus",
    "mission-kit-root",
  ]),
  next: Object.freeze([...commonOptions, "run"]),
  submit: Object.freeze([...commonOptions, "run", "input"]),
  status: Object.freeze([...commonOptions, "run"]),
  tree: Object.freeze([...commonOptions, "run"]),
  show: Object.freeze([...commonOptions, "run"]),
  validate: Object.freeze([...commonOptions, "run"]),
});

export class SurveyctlArgumentsError extends Error {
  constructor(code, message) {
    super(message);
    this.name = "SurveyctlArgumentsError";
    this.code = code;
  }
}

function fail(code, message) {
  throw new SurveyctlArgumentsError(code, message);
}

function denseArgv(argv) {
  if (!Array.isArray(argv) || types.isProxy(argv)) {
    fail(
      "SURVEYCTL_ARGUMENT_VECTOR_INVALID",
      "argv must be one dense array",
    );
  }
  const descriptors = Array.from(
    { length: argv.length },
    (_, index) =>
      Object.getOwnPropertyDescriptor(argv, String(index)),
  );
  if (
    Reflect.ownKeys(argv).some((key) => {
      if (key === "length") return false;
      return (
        typeof key !== "string" ||
        !/^(?:0|[1-9][0-9]*)$/u.test(key) ||
        Number(key) >= argv.length
      );
    }) ||
    descriptors.some(
      (descriptor) =>
        descriptor?.enumerable !== true ||
        !Object.prototype.hasOwnProperty.call(
          descriptor,
          "value",
        ),
    )
  ) {
    fail(
      "SURVEYCTL_ARGUMENT_VECTOR_INVALID",
      "argv must be dense and contain no ambient properties",
    );
  }
  const result = descriptors.map(
    (descriptor) => descriptor.value,
  );
  if (
    result.some(
      (value) =>
        typeof value !== "string" ||
        value.includes("\0") ||
        !value.isWellFormed(),
    )
  ) {
    fail(
      "SURVEYCTL_ARGUMENT_VECTOR_INVALID",
      "every argv member must be one well-formed NUL-free string",
    );
  }
  return result;
}

function positionalCount(command) {
  return command === "init" || command === "show" ? 1 : 0;
}

function parseRaw(argv) {
  if (argv.length === 0 || !commandSet.has(argv[0])) {
    fail(
      "SURVEYCTL_COMMAND_INVALID",
      `command must be exactly one of ${SURVEYCTL_COMMANDS.join(", ")}`,
    );
  }
  const command = argv[0];
  const requiredPositionals = positionalCount(command);
  if (argv.length < 1 + requiredPositionals) {
    fail(
      "SURVEYCTL_POSITIONAL_REQUIRED",
      `${command} requires exactly one positional ${
        command === "init" ? "slug" : "target"
      }`,
    );
  }
  const positionals = argv.slice(1, 1 + requiredPositionals);
  if (positionals.some((value) => value.startsWith("--"))) {
    fail(
      "SURVEYCTL_POSITIONAL_REQUIRED",
      `${command} requires its positional argument immediately after the command`,
    );
  }
  const options = new Map();
  for (
    const argument of argv.slice(1 + requiredPositionals)
  ) {
    if (!argument.startsWith("--")) {
      fail(
        "SURVEYCTL_POSITIONAL_FORBIDDEN",
        `${command} received an unexpected positional argument`,
      );
    }
    const separator = argument.indexOf("=");
    if (separator < 3) {
      fail(
        "SURVEYCTL_OPTION_SYNTAX_INVALID",
        `option must use exact --key=value syntax: ${argument}`,
      );
    }
    const key = argument.slice(2, separator);
    const value = argument.slice(separator + 1);
    if (
      !optionKeyPattern.test(key) ||
      value.length === 0
    ) {
      fail(
        "SURVEYCTL_OPTION_SYNTAX_INVALID",
        `option must have one nonempty canonical --key=value form: ${argument}`,
      );
    }
    if (!commandOptions[command].includes(key)) {
      fail(
        "SURVEYCTL_OPTION_UNKNOWN",
        `${command} does not admit --${key}`,
      );
    }
    const prior = options.get(key);
    if (prior !== undefined && key !== "source") {
      fail(
        "SURVEYCTL_OPTION_DUPLICATE",
        `--${key} cannot be repeated`,
      );
    }
    options.set(
      key,
      prior === undefined ? [value] : [...prior, value],
    );
  }
  return { command, positionals, options };
}

function optional(options, key) {
  return options.get(key)?.[0];
}

function required(options, key, command) {
  const value = optional(options, key);
  if (value === undefined) {
    fail(
      "SURVEYCTL_OPTION_REQUIRED",
      `${command} requires --${key}=...`,
    );
  }
  return value;
}

function boundedText(value, label, maximum = 512) {
  if (
    typeof value !== "string" ||
    value.length < 1 ||
    value.length > maximum ||
    !value.isWellFormed()
  ) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      `${label} must be one nonempty well-formed string of at most ${maximum} UTF-16 code units`,
    );
  }
  return value;
}

function absolutePath(value, label) {
  if (
    typeof value !== "string" ||
    value.length === 0 ||
    !path.isAbsolute(value)
  ) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      `${label} must be one explicit absolute path`,
    );
  }
  return path.resolve(value);
}

function format(options) {
  const value = optional(options, "format") ?? "text";
  if (!formatSet.has(value)) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      "--format must be exactly text or json",
    );
  }
  return value;
}

function keyLocation(options) {
  const keyRoot = optional(options, "key-root");
  const journalKeyFile = optional(
    options,
    "journal-key-file",
  );
  if (
    keyRoot !== undefined &&
    journalKeyFile !== undefined
  ) {
    fail(
      "SURVEYCTL_KEY_LOCATION_CONFLICT",
      "--key-root and --journal-key-file are mutually exclusive",
    );
  }
  if (keyRoot !== undefined) {
    return {
      keyRoot: absolutePath(keyRoot, "--key-root"),
    };
  }
  if (journalKeyFile !== undefined) {
    return {
      keyFile: absolutePath(
        journalKeyFile,
        "--journal-key-file",
      ),
    };
  }
  return {};
}

function common(command, options) {
  return {
    command,
    format: format(options),
    ...keyLocation(options),
  };
}

function sourceName(value, index, seen) {
  if (
    value.length > 512 ||
    value.includes("\\") ||
    path.posix.isAbsolute(value) ||
    path.win32.isAbsolute(value) ||
    !sourcePattern.test(value) ||
    value.split("/").some(
      (part) => part === "." || part === "..",
    ) ||
    path.posix.normalize(value) !== value
  ) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      `--source occurrence ${index + 1} must be one normalized relative POSIX file path`,
    );
  }
  if (seen.has(value)) {
    fail(
      "SURVEYCTL_OPTION_DUPLICATE",
      `--source duplicates ${value}`,
    );
  }
  seen.add(value);
  return value;
}

function booleanValue(options, key, fallback) {
  const value = optional(options, key);
  if (value === undefined) return fallback;
  if (value !== "true" && value !== "false") {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      `--${key} must be exactly true or false`,
    );
  }
  return value === "true";
}

function initCommand(positionals, options) {
  const slug = positionals[0];
  if (!slugPattern.test(slug)) {
    fail(
      "SURVEYCTL_POSITIONAL_INVALID",
      "init slug must match [a-z0-9][a-z0-9-]{0,79}",
    );
  }
  const rawSources = options.get("source") ?? [];
  if (rawSources.length < 1 || rawSources.length > 256) {
    fail(
      "SURVEYCTL_OPTION_REQUIRED",
      "init requires 1..256 --source=... options",
    );
  }
  const seenSources = new Set();
  const sources = rawSources.map(
    (value, index) =>
      sourceName(value, index, seenSources),
  );
  const axiomCorpus = booleanValue(
    options,
    "axiom-corpus",
    false,
  );
  const missionKitRoot = optional(
    options,
    "mission-kit-root",
  );
  if (axiomCorpus && missionKitRoot === undefined) {
    fail(
      "SURVEYCTL_OPTION_REQUIRED",
      "init with --axiom-corpus=true requires --mission-kit-root=...",
    );
  }
  if (!axiomCorpus && missionKitRoot !== undefined) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      "--mission-kit-root is admitted only with --axiom-corpus=true",
    );
  }
  return {
    ...common("init", options),
    slug,
    sessionsRoot: absolutePath(
      required(options, "sessions-root", "init"),
      "--sessions-root",
    ),
    sourceRoot: absolutePath(
      required(options, "source-root", "init"),
      "--source-root",
    ),
    sources: Object.freeze(sources),
    authority: Object.freeze({
      directorRef: boundedText(
        required(options, "director-ref", "init"),
        "--director-ref",
      ),
      proposerRef: boundedText(
        required(options, "proposer-ref", "init"),
        "--proposer-ref",
      ),
      bindingEvidence: boundedText(
        optional(options, "binding-evidence") ??
          "host-adapter:surveyctl",
        "--binding-evidence",
      ),
    }),
    axiomCorpus,
    ...(missionKitRoot === undefined
      ? {}
      : {
        missionKitRoot: absolutePath(
          missionKitRoot,
          "--mission-kit-root",
        ),
      }),
  };
}

function runCommand(command, options) {
  return {
    ...common(command, options),
    runDirectory: absolutePath(
      required(options, "run", command),
      "--run",
    ),
  };
}

function submitCommand(options) {
  const input = required(options, "input", "submit");
  if (input !== "-" && !path.isAbsolute(input)) {
    fail(
      "SURVEYCTL_OPTION_VALUE_INVALID",
      "--input must be '-' or one explicit absolute path",
    );
  }
  return {
    ...runCommand("submit", options),
    input: input === "-" ? "-" : path.resolve(input),
  };
}

function showCommand(positionals, options) {
  const target = positionals[0];
  if (!targetPattern.test(target) || target.includes("..")) {
    fail(
      "SURVEYCTL_POSITIONAL_INVALID",
      "show target must be one safe bounded resource target",
    );
  }
  return {
    ...runCommand("show", options),
    target,
  };
}

function deepFreeze(value) {
  if (
    value !== null &&
    typeof value === "object" &&
    !Object.isFrozen(value)
  ) {
    for (const item of Object.values(value)) deepFreeze(item);
    Object.freeze(value);
  }
  return value;
}

/**
 * Parse one surveyctl invocation. The command is the first token; init and
 * show have exactly one immediate positional. Every remaining token uses
 * --key=value, and only --source is repeatable.
 */
export function parseSurveyctlArguments(argvInput) {
  const argv = denseArgv(argvInput);
  const { command, positionals, options } = parseRaw(argv);
  let parsed;
  switch (command) {
    case "init":
      parsed = initCommand(positionals, options);
      break;
    case "submit":
      parsed = submitCommand(options);
      break;
    case "show":
      parsed = showCommand(positionals, options);
      break;
    case "next":
    case "status":
    case "tree":
    case "validate":
      parsed = runCommand(command, options);
      break;
    default:
      fail(
        "SURVEYCTL_COMMAND_INVALID",
        `unsupported command ${command}`,
      );
  }
  return deepFreeze(parsed);
}
