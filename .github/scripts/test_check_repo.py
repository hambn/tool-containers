#!/usr/bin/env python3
"""Document contract fixtures also exercised by web-ui/tests/fixtures.test.mjs."""

from __future__ import annotations

import json
import unittest
from pathlib import Path
from typing import Any

import yaml

import document_rules
from repository_check import strip_jsonc

FIXTURES = Path(__file__).resolve().parents[2] / "web-ui/tests/fixtures/documents.yaml"


def case_documents(base: dict[str, str], case: dict[str, Any]) -> dict[str, str]:
    """The base tree with the case's whole-file changes, then its replacements, applied."""
    documents = dict(base)
    for path, text in (case.get("files") or {}).items():
        if text is None:
            documents.pop(path, None)
        else:
            documents[path] = text
    for path, edits in (case.get("edit") or {}).items():
        for old, new in edits:
            count = documents[path].count(old)
            if count != 1:
                raise AssertionError(f"{case['name']}: {old!r} occurs {count} times in {path}")
            documents[path] = documents[path].replace(old, new)
    return documents


class SharedDocumentCases(unittest.TestCase):
    def test_fixture_cases(self) -> None:
        fixtures = yaml.safe_load(FIXTURES.read_text())
        names = [case["name"] for case in fixtures["cases"]]
        self.assertEqual(len(names), len(set(names)), "case names must be unique")
        for case in fixtures["cases"]:
            with self.subTest(case=case["name"]):
                problems = document_rules.check_documents(case_documents(fixtures["base"], case))
                self.assertEqual(
                    sorted({path for path, _ in problems}), sorted(case["invalid"]), problems
                )


class DocumentRules(unittest.TestCase):
    def test_duplicate_keys_name_the_key(self) -> None:
        _, _, error = document_rules.split_frontmatter("---\ntitle: a\ntitle: b\n---\n")
        self.assertIn("duplicate key 'title'", error)

    def test_booleans_are_not_orders(self) -> None:
        meta, problems = document_rules.validate_frontmatter(
            {"name": "ai", "title": "AI", "description": "x" * 120, "order": True}, "category", "ai"
        )
        self.assertEqual(meta.get("order"), None)
        self.assertTrue(any(problem.startswith("order:") for problem in problems), problems)

    def test_tools_section_reports_each_bad_line(self) -> None:
        body = "# AI\n\n## Tools\n\n- [a](./a/) — Fine.\nstray text\n- [b](./b/) - wrong dash\n"
        problems = document_rules.tools_section_problems(body, ["a", "b"])
        self.assertEqual(len([p for p in problems if "is not a" in p]), 2, problems)
        self.assertTrue(any("expected a, b, got a" in p for p in problems), problems)

    def test_tools_section_ends_at_the_next_section(self) -> None:
        body = "## Tools\n\n- [a](./a/) — Fine.\n\n## Tags\n\nAnything goes here.\n"
        self.assertEqual(document_rules.tools_section_problems(body, ["a"]), [])


class JsoncRules(unittest.TestCase):
    def test_comments_are_dropped_outside_strings(self) -> None:
        text = '{\n  // line\n  "a": "http://x/*y*/", /* block */\n  "b": "q\\"//"\n}\n'
        self.assertEqual(json.loads(strip_jsonc(text)), {"a": "http://x/*y*/", "b": 'q"//'})

    def test_comments_do_not_join_adjacent_tokens(self) -> None:
        with self.assertRaises(ValueError):
            json.loads(strip_jsonc('{"a": 1/* comment */2}'))

    def test_unterminated_block_comment_fails(self) -> None:
        with self.assertRaises(ValueError):
            strip_jsonc('{"a": 1 /* open\n}')


if __name__ == "__main__":
    unittest.main()
