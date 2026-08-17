import { dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CampaignOrchestrator,
  checkEvaluatorPackage,
} from "../orchestrator/index.mjs";
import {
  EvaluatorError,
  ValidationError,
  asResult,
} from "../engine/errors.mjs";

const COMMANDS = new Set([
  "campaign init",
  "campaign seal",
  "campaign validate",
  "campaign run",
  "campaign resume",
  "campaign status",
  "campaign report",
  "package check",
]);

function usage() {
  return [
    "usage:",
    "  campaign <init|seal|validate|run|resume|status|report> [options]",
    "  package check [--root PATH]",
    "",
    "options:",
    "  --workspace PATH          campaign workspace (default: current directory)",
    "  --campaign-id ID          authored campaign ID for init",
    "  --root PATH               evaluator package root",
    "  --lifecycle-manifest PATH injected lifecycle manifest",
    "  --schema-catalog PATH      injected schema catalog",
    "  --schema-root PATH         injected generated schema directory",
    "  --driver PATH              explicit campaign execution-driver module",
    "  --help                     show this help",
  ].join("\n");
}

function parse(argv, forcedCommand) {
  const tokens = [...argv];
  let command = forcedCommand ?? null;
  if (command === null) {
    if (tokens.length < 2) {
      if (tokens.includes("--help") || tokens.includes("-h")) {
        return { help: true };
      }
      throw new ValidationError("A two-part command is required");
    }
    command = `${tokens.shift()} ${tokens.shift()}`;
  }
  if (!COMMANDS.has(command)) {
    throw new ValidationError("Unknown evaluator command", { command });
  }
  const options = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--help" || token === "-h") {
      options.help = true;
      continue;
    }
    const key = new Map([
      ["--workspace", "workspaceRoot"],
      ["--campaign-id", "campaignId"],
      ["--root", "packageRoot"],
      ["--lifecycle-manifest", "lifecycleManifestPath"],
      ["--schema-catalog", "schemaCatalogPath"],
      ["--schema-root", "schemasRoot"],
      ["--driver", "driverPath"],
    ]).get(token);
    if (!key) throw new ValidationError("Unknown command option", { token });
    const value = tokens[index + 1];
    if (!value || value.startsWith("--")) {
      throw new ValidationError("Command option requires a value", { token });
    }
    if (Object.hasOwn(options, key)) {
      throw new ValidationError("Command option is repeated", { token });
    }
    options[key] = value;
    index += 1;
  }
  return { command, ...options };
}

function resolveOption(base, value) {
  if (value === undefined) return undefined;
  return isAbsolute(value) ? value : resolve(base, value);
}

async function loadExecutionDriver(driverPath, context) {
  if (!driverPath) return null;
  const module = await import(pathToFileURL(driverPath).href);
  if (typeof module.createExecutionDriver === "function") {
    return module.createExecutionDriver(context);
  }
  return module.executionDriver ?? module.default ?? null;
}

function writeJson(stream, value) {
  stream.write(`${JSON.stringify(value)}\n`);
}

export async function runCommand(
  argv,
  {
    forcedCommand,
    cwd = process.cwd(),
    packageRoot: configuredPackageRoot,
    stdout = process.stdout,
    stderr = process.stderr,
    orchestratorFactory = CampaignOrchestrator.open,
    packageChecker = checkEvaluatorPackage,
  } = {},
) {
  try {
    const parsed = parse(argv, forcedCommand);
    if (parsed.help) {
      stdout.write(`${usage()}\n`);
      return 0;
    }
    const defaultPackageRoot = resolve(
      dirname(fileURLToPath(import.meta.url)),
      "../../..",
    );
    const packageRoot = resolveOption(
      cwd,
      parsed.packageRoot ?? configuredPackageRoot ?? defaultPackageRoot,
    );
    if (parsed.command === "package check") {
      const result = await packageChecker(packageRoot);
      writeJson(stdout, {
        ok: true,
        command: parsed.command,
        result,
      });
      return 0;
    }

    const workspaceRoot = resolveOption(cwd, parsed.workspaceRoot ?? cwd);
    const driverPath = resolveOption(cwd, parsed.driverPath);
    const executionDriver = await loadExecutionDriver(driverPath, {
      packageRoot,
      workspaceRoot,
    });
    const orchestrator = await orchestratorFactory({
      packageRoot,
      workspaceRoot,
      lifecycleManifestPath: resolveOption(cwd, parsed.lifecycleManifestPath),
      schemaCatalogPath: resolveOption(cwd, parsed.schemaCatalogPath),
      schemasRoot: resolveOption(cwd, parsed.schemasRoot),
      executionDriver,
    });
    let result;
    if (parsed.command === "campaign init") {
      result = await orchestrator.init({ campaignId: parsed.campaignId });
    } else if (parsed.command === "campaign seal") {
      result = await orchestrator.seal();
    } else if (parsed.command === "campaign validate") {
      result = await orchestrator.validate();
    } else if (parsed.command === "campaign run") {
      result = await orchestrator.advance({ resume: false });
    } else if (parsed.command === "campaign resume") {
      result = await orchestrator.advance({ resume: true });
    } else if (parsed.command === "campaign status") {
      result = await orchestrator.status();
    } else if (parsed.command === "campaign report") {
      result = await orchestrator.report();
    }
    writeJson(stdout, { ok: true, command: parsed.command, result });
    return 0;
  } catch (error) {
    const failure = asResult(error);
    writeJson(stderr, failure);
    return error instanceof EvaluatorError ? 2 : 1;
  }
}

export { parse, usage };
