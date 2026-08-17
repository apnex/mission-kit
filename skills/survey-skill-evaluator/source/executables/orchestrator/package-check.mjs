import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { join } from "node:path";
import { ValidationError } from "../engine/errors.mjs";

const execFileAsync = promisify(execFile);

export async function checkEvaluatorPackage(
  packageRoot,
  { execute = execFileAsync } = {},
) {
  if (!packageRoot) {
    throw new ValidationError("Package check requires an evaluator root");
  }
  const executable = join(packageRoot, "compile.sh");
  const result = await execute(
    executable,
    ["--check", "--verify-package", "--root", packageRoot],
    {
      cwd: packageRoot,
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
    },
  );
  return {
    valid: true,
    packageRoot,
    stdout: result?.stdout ?? "",
    stderr: result?.stderr ?? "",
  };
}
