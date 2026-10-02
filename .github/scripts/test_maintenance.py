"""Cleanup safety and README transformations, without registry mutations."""

from __future__ import annotations

import importlib
import io
import tempfile
import unittest
from datetime import UTC, datetime, timedelta
from pathlib import Path
from unittest.mock import patch

import ci
import ghcr_cleanup
import hub_readme
import repository_check

D1 = "sha256:" + "1" * 64
D2 = "sha256:" + "2" * 64
D3 = "sha256:" + "3" * 64
D4 = "sha256:" + "4" * 64
NOW = datetime(2026, 9, 30, tzinfo=UTC)
OLD = NOW - timedelta(days=30)


def version(
    number: int, image_digest: str, tags: tuple[str, ...] = (), updated: datetime = OLD
) -> ghcr_cleanup.PackageVersion:
    return ghcr_cleanup.PackageVersion(number, image_digest, tags, updated)


class CleanupTests(unittest.TestCase):
    def setUp(self) -> None:
        self.package = ghcr_cleanup.Package("hambn", "t3code")

    def test_tagged_indexes_keep_runtime_images_and_attestations(self) -> None:
        manifests = {D1: {"manifests": [{"digest": D2}, {"digest": D3}]}, D2: {}, D3: {}, D4: {}}
        versions = [version(1, D1, ("ubuntu",)), version(2, D2), version(3, D3), version(4, D4)]
        with patch.object(self.package, "manifest", side_effect=manifests.get):
            self.assertEqual(
                self.package.candidates(versions, NOW - timedelta(days=14)), [versions[-1]]
            )

    def test_recent_untagged_index_keeps_its_older_children(self) -> None:
        versions = [version(1, D1, updated=NOW), version(2, D2)]
        with patch.object(
            self.package,
            "manifest",
            side_effect=lambda value: {"manifests": [{"digest": D2}]} if value == D1 else {},
        ):
            self.assertEqual(self.package.candidates(versions, NOW - timedelta(days=14)), [])

    def test_recent_versions_and_oci_subjects_are_kept(self) -> None:
        versions = [version(1, D1, updated=NOW), version(2, D2)]
        with patch.object(self.package, "manifest", return_value={"subject": {"digest": D3}}):
            self.assertEqual(self.package.candidates(versions, NOW - timedelta(days=14)), [])

    def test_cosign_suffix_tags_are_checked_against_the_subject(self) -> None:
        for suffix in ("", ".sig", ".att", ".sbom"):
            with (
                self.subTest(suffix=suffix),
                patch.object(self.package, "manifest", return_value=None) as manifest,
            ):
                self.assertTrue(self.package.orphan_tag("sha256-" + "1" * 64 + suffix))
                manifest.assert_called_once_with(D1)
        with patch.object(self.package, "manifest") as manifest:
            self.assertFalse(self.package.orphan_tag("ubuntu"))
            self.assertFalse(self.package.orphan_tag("sha256-not-a-digest"))
            manifest.assert_not_called()

    def test_a_missing_tagged_manifest_aborts_cleanup(self) -> None:
        with (
            patch.object(self.package, "manifest", return_value=None),
            self.assertRaisesRegex(ValueError, "cleanup stopped"),
        ):
            self.package.candidates([version(1, D1, ("ubuntu",))], NOW)

    def test_registry_error_happens_before_any_deletion(self) -> None:
        versions = [version(1, D1), version(2, D2)]
        with (
            patch.object(self.package, "versions", return_value=versions),
            patch.object(self.package, "manifest", side_effect=[{}, RuntimeError("429")]),
            patch("ghcr_cleanup.run") as run,
            self.assertRaises(RuntimeError),
        ):
            self.package.clean(timedelta(days=14), False)
        run.assert_not_called()

    def test_dry_run_never_calls_delete(self) -> None:
        with (
            patch.object(self.package, "versions", return_value=[version(1, D1)]),
            patch.object(self.package, "manifest", return_value={}),
            patch("ghcr_cleanup.run") as run,
        ):
            self.package.clean(timedelta(days=14), True)
        run.assert_not_called()

    def test_manifest_reads_are_cached(self) -> None:
        with patch("ghcr_cleanup.run") as run:
            run.return_value.returncode = 0
            run.return_value.stdout = "{}"
            self.package.manifest(D1)
            self.package.manifest(D1)
        run.assert_called_once()


class HubReadmeTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.readme = self.root / "tools/ai/t3code/README.md"
        self.readme.parent.mkdir(parents=True)
        self.readme.touch()
        (self.readme.parent / "docs").mkdir()

    def rewrite(self, text: str) -> str:
        return hub_readme.rewrite(self.readme, text, root=self.root)

    def test_frontmatter_files_directories_images_and_fragments(self) -> None:
        result = self.rewrite(
            "---\r\nname: t3code\r\n---\r\n\r\n[docs](./docs/#run)\n[code](./run.sh)\n![image](./logo.png#preview)\n"
        )
        self.assertNotIn("name: t3code", result)
        self.assertIn(f"{hub_readme.REPOSITORY}/tree/main/tools/ai/t3code/docs#run", result)
        self.assertIn(f"{hub_readme.REPOSITORY}/blob/main/tools/ai/t3code/run.sh", result)
        self.assertIn(f"{hub_readme.RAW}/tools/ai/t3code/logo.png#preview", result)

    def test_external_anchor_and_fenced_example_links_are_untouched(self) -> None:
        text = "[anchor](#run)\n[external](https://example.com)\n```markdown\n[example](./local)\n```\n[real](./local)\n"
        result = self.rewrite(text)
        self.assertIn("```markdown\n[example](./local)\n```", result)
        self.assertIn("[anchor](#run)", result)
        self.assertIn("[external](https://example.com)", result)
        self.assertIn(f"[real]({hub_readme.REPOSITORY}/blob/main/tools/ai/t3code/local)", result)

    def test_links_cannot_escape_repository(self) -> None:
        with self.assertRaises(ValueError):
            self.rewrite("[outside](../../../../outside)")


class SharedHelperTests(unittest.TestCase):
    def test_checksum_failure_does_not_replace_existing_file(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "executable"
            path.write_bytes(b"old executable")
            with (
                patch("urllib.request.urlopen", return_value=io.BytesIO(b"wrong content")),
                self.assertRaisesRegex(ValueError, "SHA256 mismatch"),
            ):
                ci.download_verified("https://example.com/file", path, "0" * 64)
            self.assertEqual(path.read_bytes(), b"old executable")
            self.assertEqual(list(Path(directory).iterdir()), [path])

    def test_importing_repository_checker_does_not_change_cwd(self) -> None:
        with patch("os.chdir") as chdir, patch("subprocess.run") as run:
            importlib.reload(repository_check)
        chdir.assert_not_called()
        run.assert_not_called()


if __name__ == "__main__":
    unittest.main()
