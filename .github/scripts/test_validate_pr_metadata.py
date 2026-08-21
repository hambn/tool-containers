#!/usr/bin/env python3
"""Regression tests for pull request metadata policy."""

import unittest

from validate_pr_metadata import validate


VALID_BODY = """## Summary

- Explain the change.

## Validation

- `bash validate-change.sh` passed.

## Checklist

- [x] Complete.
"""


class PullRequestMetadataTests(unittest.TestCase):
    def test_accepts_scoped_breaking_title_and_complete_body(self) -> None:
        self.assertEqual(validate("feat(agentimg)!: change runtime", VALID_BODY, "hambn"), [])

    def test_dependabot_does_not_need_repository_body_sections(self) -> None:
        self.assertEqual(validate("chore(actions): bump checkout", "", "dependabot[bot]"), [])

    def test_rejects_invalid_title(self) -> None:
        errors = validate("Update workflow", VALID_BODY, "hambn")
        self.assertTrue(any("Conventional Commits" in error for error in errors))

    def test_rejects_missing_required_section(self) -> None:
        errors = validate("docs: explain policy", "## Summary\n\n- Details\n", "hambn")
        self.assertIn("PR body is missing required sections: ## Validation", errors)

    def test_rejects_placeholder_only_sections(self) -> None:
        for marker in ("-", "*", "+"):
            with self.subTest(marker=marker):
                body = f"""## Summary

<!-- Explain what changed. -->
{marker}

## Validation

{marker} [ ] Run checks.
"""
                errors = validate("docs: explain policy", body, "hambn")
                self.assertIn(
                    "PR body sections must contain meaningful details: "
                    "## Summary, ## Validation",
                    errors,
                )

    def test_rejects_duplicate_required_section(self) -> None:
        body = VALID_BODY + "\n## Summary\n\n- A second summary.\n"
        errors = validate("docs: explain policy", body, "hambn")
        self.assertIn("PR body repeats required sections: ## Summary", errors)


if __name__ == "__main__":
    unittest.main()
