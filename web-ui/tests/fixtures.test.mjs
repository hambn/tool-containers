import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { discover } from "../src/lib/content.mjs";

// The cases check-repo.py also runs (.github/scripts/test_check_repo.py): both
// validators must report exactly the same documents as invalid.
const fixtures = parse(readFileSync(new URL("./fixtures/documents.yaml", import.meta.url), "utf8"));

/** The base tree with the case's whole-file changes, then its replacements, applied. */
function caseDocuments(base, testCase) {
  const documents = { ...base };
  for (const [file, text] of Object.entries(testCase.files ?? {})) {
    if (text === null) delete documents[file];
    else documents[file] = text;
  }
  for (const [file, edits] of Object.entries(testCase.edit ?? {})) {
    for (const [old, replacement] of edits) {
      const count = documents[file].split(old).length - 1;
      assert.equal(count, 1, `${testCase.name}: ${JSON.stringify(old)} occurs ${count} times in ${file}`);
      documents[file] = documents[file].replace(old, () => replacement);
    }
  }
  return documents;
}

test("shared case names are unique", () => {
  const names = fixtures.cases.map((testCase) => testCase.name);
  assert.equal(new Set(names).size, names.length);
});

for (const testCase of fixtures.cases) {
  test(`shared case: ${testCase.name}`, () => {
    const documents = caseDocuments(fixtures.base, testCase);
    const files = Object.keys(documents).sort();
    const { problems } = discover({ files, read: (file) => documents[file] });
    const invalid = [...new Set(problems.map((problem) => problem.slice(0, problem.indexOf(": "))))].sort();
    assert.deepEqual(invalid, [...testCase.invalid].sort(), problems.join("\n"));
  });
}
