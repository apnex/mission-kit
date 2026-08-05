import assert from "node:assert/strict";
import { parse } from "acorn";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(
  new URL("../../../", import.meta.url),
);
const roots = Object.freeze([
  "source/authoring/adapters/in-memory-store.mjs",
  "source/authoring/kernel/text-forms.mjs",
  "source/authoring/runtime/transaction-coordinator.mjs",
  "tests/fixtures/authoring/non-survey-brief/brief-profile.mjs",
  "tests/fixtures/authoring/non-survey-brief/profile-executables.mjs",
]);
const allowedBuiltins = new Set([
  "node:crypto",
  "node:fs/promises",
  "node:util",
]);
function packagePath(relative) {
  return path.join(packageRoot, ...relative.split("/"));
}

function moduleSpecifiers(source, sourcePath) {
  let ast;
  try {
    ast = parse(source, {
      ecmaVersion: "latest",
      sourceType: "module",
      allowHashBang: true,
    });
  } catch (error) {
    throw new Error(
      `${sourcePath} is not valid ECMAScript: ${error.message}`,
    );
  }
  const specifiers = [];
  for (const statement of ast.body) {
    if (statement.type === "ImportDeclaration") {
      specifiers.push(statement.source.value);
    } else if (
      (
        statement.type === "ExportNamedDeclaration" ||
        statement.type === "ExportAllDeclaration"
      ) &&
      statement.source !== null
    ) {
      specifiers.push(statement.source.value);
    }
  }
  function walk(node) {
    if (node === null || typeof node !== "object") return;
    if (node.type === "ImportExpression") {
      throw new Error(
        `dynamic import entered at ${sourcePath}`,
      );
    }
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "Identifier" &&
      node.callee.name === "require"
    ) {
      throw new Error(
        `CommonJS require entered at ${sourcePath}`,
      );
    }
    if (
      node.type === "CallExpression" &&
      node.callee?.type === "MemberExpression" &&
      node.callee.object?.type === "Identifier" &&
      node.callee.object.name === "process" &&
      (
        (
          node.callee.computed === false &&
          node.callee.property?.type === "Identifier" &&
          node.callee.property.name === "getBuiltinModule"
        ) ||
        (
          node.callee.computed === true &&
          node.callee.property?.type === "Literal" &&
          node.callee.property.value === "getBuiltinModule"
        )
      )
    ) {
      throw new Error(
        `process builtin loader entered at ${sourcePath}`,
      );
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        value.forEach(walk);
      } else if (
        value !== null &&
        typeof value === "object"
      ) {
        walk(value);
      }
    }
  }
  walk(ast);
  return specifiers;
}

test(
  "the executed Brief kernel closure imports no Survey-domain module",
  async () => {
    assert.deepEqual(
      moduleSpecifiers(
        "import/* comment-separated */ value from './fixture.mjs';",
        "static-import-falsification",
      ),
      ["./fixture.mjs"],
    );
    assert.throws(
      () => moduleSpecifiers(
        "import/* comment-separated */('./fixture.mjs');",
        "dynamic-import-falsification",
      ),
      /dynamic import entered/u,
    );
    assert.throws(
      () => {
        for (const specifier of moduleSpecifiers(
          "import { createRequire as makeLoader } from 'node:module';",
          "builtin-loader-falsification",
        )) {
          assert.equal(
            allowedBuiltins.has(specifier),
            true,
            `unapproved builtin ${specifier} entered at builtin-loader-falsification`,
          );
        }
      },
      /unapproved builtin node:module/u,
    );
    assert.throws(
      () => moduleSpecifiers(
        "process/* comment-separated */.getBuiltinModule('module');",
        "process-loader-falsification",
      ),
      /process builtin loader entered/u,
    );

    const pending = [...roots];
    const visited = new Set();
    while (pending.length > 0) {
      const relative = pending.shift();
      if (visited.has(relative)) continue;
      visited.add(relative);
      assert.equal(
        relative.startsWith("source/authoring/survey/"),
        false,
        `Survey-domain import entered at ${relative}`,
      );
      assert.equal(
        relative.startsWith("source/executables/runtime/"),
        false,
        `runtime-storage import entered at ${relative}`,
      );
      const source = await readFile(packagePath(relative), "utf8");
      for (const specifier of moduleSpecifiers(
        source,
        relative,
      )) {
        if (specifier.startsWith("node:")) {
          assert.equal(
            allowedBuiltins.has(specifier),
            true,
            `unapproved builtin ${specifier} entered at ${relative}`,
          );
          continue;
        }
        assert.equal(
          specifier.startsWith("."),
          true,
          `external import ${specifier} entered at ${relative}`,
        );
        const absolute = path.resolve(
          path.dirname(packagePath(relative)),
          specifier,
        );
        const target = path
          .relative(packageRoot, absolute)
          .split(path.sep)
          .join("/");
        assert.equal(
          target.startsWith("../"),
          false,
          `import escaped the package at ${relative}`,
        );
        pending.push(target);
      }
    }

    assert.equal(
      visited.has(
        "source/authoring/kernel/manifest-reducer.mjs",
      ),
      true,
    );
    assert.equal(
      visited.has(
        "source/authoring/runtime/journal-replay.mjs",
      ),
      true,
    );
    assert.equal(
      visited.has(
        "source/authoring/adapters/in-memory-store.mjs",
      ),
      true,
    );
  },
);
