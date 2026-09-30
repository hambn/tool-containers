"""Regression checks for layer reuse, planning failures, and publication boundaries."""

from __future__ import annotations

import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

import yaml

import build
import ci
import image_common as images
import plan
import publish

ROOT = Path(__file__).resolve().parents[2]
D1 = "sha256:" + "1" * 64
D2 = "sha256:" + "2" * 64
D3 = "sha256:" + "3" * 64
GHCR = "ghcr.io/hambn"
CACHE = GHCR + "/buildcache"


def index(image_digest: str = D1, arches: tuple[str, ...] = ("amd64", "arm64")) -> dict:
    return {
        "digest": image_digest,
        "manifests": [
            {
                "digest": D2 if arch == "amd64" else D3,
                "platform": {"os": "linux", "architecture": arch},
            }
            for arch in arches
        ],
    }


def target(variant: str = "ubuntu", base: str = "", distro: str = "ubuntu") -> dict:
    return {
        "args": {"BASE_IMAGE": base},
        "labels": {
            images.LABEL_PREFIX + "variant": variant,
            images.LABEL_PREFIX + "distro": distro,
            images.LABEL_PREFIX + "tier": "agent",
        },
    }


class ImagePolicyTests(unittest.TestCase):
    def test_registry_errors_are_not_missing_images(self) -> None:
        for message in ("unauthorized", "429 Too Many Requests", "connection timed out"):
            with (
                self.subTest(message=message),
                patch(
                    "image_common.run", return_value=subprocess.CompletedProcess([], 1, "", message)
                ),
                self.assertRaises(RuntimeError),
            ):
                images.inspect(GHCR + "/core:ubuntu", missing_ok=True)
        with patch(
            "image_common.run",
            return_value=subprocess.CompletedProcess(
                [], 1, "", "ghcr.io/hambn/core:ubuntu: not found"
            ),
        ):
            self.assertIsNone(images.inspect(GHCR + "/core:ubuntu", missing_ok=True))

    def test_attestations_are_not_runtime_architectures(self) -> None:
        manifest = index()
        manifest["manifests"].append(
            {"digest": D1, "platform": {"os": "unknown", "architecture": "unknown"}}
        )
        self.assertEqual(images.platform_manifests(manifest), {"amd64": D2, "arm64": D3})
        manifest["manifests"].append(manifest["manifests"][0])
        with self.assertRaisesRegex(ValueError, "Duplicate"):
            images.platform_manifests(manifest)

    def test_pins_keep_registry_ports_and_remove_tags(self) -> None:
        self.assertEqual(
            images.pinned("registry:5000/team/tool:ubuntu", D1), f"registry:5000/team/tool@{D1}"
        )
        with self.assertRaises(ValueError):
            images.pinned("tool:ubuntu", "bad")

    def test_fixed_epoch_native_platform_and_same_distro_caches(self) -> None:
        targets = {
            "agent-ubuntu": target(),
            "agent-browser": target("ubuntu-browser"),
            "agent-alpine": target("alpine", distro="alpine"),
        }
        options = build.bake_options(
            Path("tools/ai/agent"), "agent-ubuntu", "arm64", CACHE, targets
        )
        self.assertIn(f"agent-ubuntu.args.SOURCE_DATE_EPOCH={images.SOURCE_DATE_EPOCH}", options)
        self.assertIn("agent-ubuntu.platform=linux/arm64", options)
        self.assertIn(
            f"agent-ubuntu.cache-from=type=registry,ref={CACHE}:agent-ubuntu-arm64", options
        )
        self.assertIn(
            f"agent-ubuntu.cache-from+=type=registry,ref={CACHE}:agent-ubuntu-browser-arm64",
            options,
        )
        self.assertFalse(any("alpine" in option for option in options))
        self.assertEqual(build.build_environment()["SOURCE_DATE_EPOCH"], images.SOURCE_DATE_EPOCH)
        self.assertIn("force-compression=false", images.LAYER_EXPORT)

    def test_refresh_never_moves_backwards(self) -> None:
        self.assertEqual(
            images.retained_refresh("2026-09-25", [{images.OS_REFRESH_LABEL: "2026-09-29"}]),
            "2026-09-29",
        )
        self.assertEqual(
            images.retained_refresh("2026-09-30", [{images.OS_REFRESH_LABEL: "2026-09-29"}]),
            "2026-09-30",
        )
        self.assertEqual(images.retained_refresh("", [{images.OS_REFRESH_LABEL: "2026-09-29"}]), "")
        with self.assertRaises(ValueError):
            images.retained_refresh("2026-02-31", [])

    def test_actions_values_cannot_inject_extra_outputs(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "output"
            with patch.dict(os.environ, {"GITHUB_OUTPUT": str(path)}):
                ci.write_actions("GITHUB_OUTPUT", {"description": "safe\nEOF\npublish=true"})
            lines = path.read_text().splitlines()
            delimiter = lines[0].split("<<", 1)[1]
            self.assertNotEqual(delimiter, "EOF")
            self.assertEqual(lines[-1], delimiter)


class PlanningTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.tool = Path("tools/ai/agent")
        (self.root / self.tool).mkdir(parents=True)
        (self.root / self.tool / "Dockerfile").write_text("ARG OS_REFRESH=2026-09-25\n")
        self.planner = plan.Planner(self.root, GHCR)
        self.planner.targets[self.tool] = {"agent-ubuntu": target(base=GHCR + "/devbox:ubuntu")}
        self.planner.manifests[GHCR + "/devbox:ubuntu"] = index()
        self.planner.manifests[GHCR + "/agent:ubuntu"] = index()

    def test_current_variants_scan_both_architectures_at_one_digest(self) -> None:
        labels = [{images.BASE_DIGEST_LABEL: D1}] * 2
        with (
            patch.object(self.planner, "published_labels", return_value=labels),
            patch("plan.fixable_os_vulnerabilities", return_value=False) as scan,
        ):
            self.assertEqual(plan.select_variants(self.planner, self.tool, True), [])
        self.assertEqual([call.args[1] for call in scan.call_args_list], ["amd64", "arm64"])
        self.assertTrue(all(call.args[0] == f"{GHCR}/agent@{D1}" for call in scan.call_args_list))

    def test_parent_movement_preserves_refresh_and_skips_remote_rescan(self) -> None:
        labels = [{images.BASE_DIGEST_LABEL: D2, images.OS_REFRESH_LABEL: "2026-09-29"}] * 2
        with (
            patch.object(self.planner, "published_labels", return_value=labels),
            patch("plan.fixable_os_vulnerabilities") as scan,
        ):
            variants = plan.select_variants(self.planner, self.tool, True)
        scan.assert_not_called()
        self.assertEqual(variants[0].base, f"{GHCR}/devbox@{D1}")
        self.assertEqual(variants[0].os_refresh, "2026-09-29")

    def test_arm64_vulnerability_requests_refresh(self) -> None:
        with (
            patch.object(
                self.planner, "published_labels", return_value=[{images.BASE_DIGEST_LABEL: D1}] * 2
            ),
            patch("plan.fixable_os_vulnerabilities", side_effect=[False, True]),
        ):
            variants = plan.select_variants(self.planner, self.tool, True)
        self.assertGreaterEqual(variants[0].os_refresh, "2026-09-25")

    def test_trivy_operational_error_aborts_planning(self) -> None:
        with (
            patch("plan.run", return_value=subprocess.CompletedProcess([], 1)),
            self.assertRaises(RuntimeError),
        ):
            plan.fixable_os_vulnerabilities(GHCR + "/agent:ubuntu", "amd64", self.root)

    def test_unpublished_chain_pins_its_first_available_ancestor(self) -> None:
        devbox = Path("tools/base/devbox")
        (self.root / devbox).mkdir(parents=True)
        self.planner.targets[devbox] = {"devbox-ubuntu": target(base=GHCR + "/core:ubuntu")}
        self.planner.manifests[GHCR + "/devbox:ubuntu"] = None
        self.planner.manifests[GHCR + "/core:ubuntu"] = index()
        base, parents = self.planner.parents(GHCR + "/devbox:ubuntu")
        self.assertEqual(base, "")
        self.assertEqual(
            parents,
            [{"dir": devbox.as_posix(), "target": "devbox-ubuntu", "base": f"{GHCR}/core@{D1}"}],
        )
        with patch.object(self.planner, "published_labels") as labels:
            self.assertEqual(plan.select_variants(self.planner, self.tool, True), [])
        labels.assert_not_called()

    def test_parent_cycle_is_an_error(self) -> None:
        devbox = Path("tools/base/devbox")
        (self.root / devbox).mkdir(parents=True)
        self.planner.targets[devbox] = {"devbox-ubuntu": target(base=GHCR + "/devbox:ubuntu")}
        self.planner.manifests[GHCR + "/devbox:ubuntu"] = None
        with self.assertRaisesRegex(ValueError, "cycle"):
            self.planner.parents(GHCR + "/devbox:ubuntu")


class BuildBoundaryTests(unittest.TestCase):
    def setUp(self) -> None:
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.root = Path(self.temporary.name)
        self.env = patch.dict(
            os.environ,
            {
                "GITHUB_WORKSPACE": str(ROOT),
                "TOOL": "tools/ai/t3code",
                "RUNNER_TEMP": str(self.root),
                "TARGET": "t3code-ubuntu",
                "ARCH": "amd64",
                "IMAGE": "t3code",
                "VARIANT": "ubuntu",
                "CACHE": CACHE,
                "GHCR": GHCR,
                "PUBLISH": "true",
                "GITHUB_REF": "refs/heads/main",
                "GITHUB_EVENT_NAME": "push",
                "VERSION": "0.0.42",
                "GITHUB_SHA": "1234",
                "GITHUB_REPOSITORY": "hambn/tool-containers",
                "BASE": f"{GHCR}/agentbloat@{D1}",
                "OS_REFRESH": "",
                "DISTRO": "ubuntu",
                "TIER": "agent",
            },
        )
        self.env.start()
        self.addCleanup(self.env.stop)
        self.builder = build.Builder()
        self.builder.save(
            {
                "options": ["t3code-ubuntu.args.BASE_IMAGE=frozen"],
                "passed": ["structure", "smoke", "scan"],
                "layers": [D2],
            }
        )

    def export(self, options: list[str], **kwargs: object) -> None:
        (self.root / "metadata.json").write_text(
            json.dumps({"t3code-ubuntu": {"containerimage.digest": D1}})
        )

    def test_push_uses_tested_inputs_and_preserves_cache_names(self) -> None:
        before = self.builder.state()["options"]
        with (
            patch.object(self.builder, "execute", side_effect=self.export) as execute,
            patch(
                "build.inspect",
                side_effect=[index(arches=("amd64",)), {"rootfs": {"diff_ids": [D2]}}],
            ),
        ):
            self.builder.push()
        options = execute.call_args.args[0]
        self.assertEqual(options[: len(before)], before)
        self.assertIn(
            f"t3code-ubuntu.cache-to=type=registry,ref={CACHE}:t3code-ubuntu-amd64,mode=max,oci-mediatypes=true,image-manifest=true,compression=gzip,force-compression=false",
            options,
        )
        self.assertFalse(any("ignore-error=true" in item for item in options))
        self.assertEqual((self.root / "digests/ubuntu-amd64").read_text().strip(), D1)

    def test_layer_mismatch_does_not_produce_publication_artifact(self) -> None:
        with (
            patch.object(self.builder, "execute", side_effect=self.export),
            patch(
                "build.inspect",
                side_effect=[index(arches=("amd64",)), {"rootfs": {"diff_ids": [D3]}}],
            ),
            self.assertRaisesRegex(ValueError, "differ"),
        ):
            self.builder.push()
        self.assertFalse((self.root / "digests").exists())

    def test_failed_cache_export_does_not_produce_artifact(self) -> None:
        with (
            patch.object(self.builder, "execute", side_effect=RuntimeError("cache push failed")),
            self.assertRaises(RuntimeError),
        ):
            self.builder.push()
        self.assertFalse((self.root / "digests").exists())

    def test_pull_requests_cannot_write_image_or_cache(self) -> None:
        for values in (
            {"PUBLISH": "false"},
            {"GITHUB_EVENT_NAME": "pull_request"},
            {"GITHUB_REF": "refs/pull/1/merge"},
        ):
            with (
                self.subTest(values=values),
                patch.dict(os.environ, values),
                patch.object(self.builder, "execute") as execute,
            ):
                with self.assertRaises(ValueError):
                    self.builder.push()
                execute.assert_not_called()

    def test_failed_or_missing_checks_block_export(self) -> None:
        state = self.builder.state()
        state["passed"] = ["structure", "smoke"]
        self.builder.save(state)
        with (
            patch.object(self.builder, "execute") as execute,
            self.assertRaisesRegex(ValueError, "must pass"),
        ):
            self.builder.push()
        execute.assert_not_called()

    def test_source_parent_uses_fixed_epoch_cache_and_native_arch(self) -> None:
        parents = [{"dir": "tools/base/core", "target": "core-ubuntu", "base": ""}]

        def fake_export(options: list[str], **kwargs: object) -> None:
            directory = self.root / "parent-0"
            directory.mkdir()
            (directory / "index.json").write_text(json.dumps({"manifests": [{"digest": D1}]}))

        with (
            patch.dict(os.environ, {"PARENTS": json.dumps(parents)}),
            patch.object(self.builder, "execute", side_effect=fake_export) as execute,
        ):
            self.builder.parents()
        options = execute.call_args.args[0]
        self.assertIn(f"core-ubuntu.args.SOURCE_DATE_EPOCH={images.SOURCE_DATE_EPOCH}", options)
        self.assertIn("core-ubuntu.platform=linux/amd64", options)
        self.assertTrue(any(f"{CACHE}:core-ubuntu-amd64" in item for item in options))
        self.assertEqual(
            (self.root / "parent-context.txt").read_text(),
            f"oci-layout://{self.root}/parent-0@{D1}",
        )


class PublicationTests(unittest.TestCase):
    def test_tags_preserve_existing_public_contract(self) -> None:
        self.assertEqual(
            publish.tags("ubuntu", "0.0.42", "ubuntu", "t3code"),
            ["ubuntu", "latest", "t3code-0.0.42"],
        )
        self.assertEqual(
            publish.tags("ubuntu-browser", "0.0.42", "ubuntu", "t3code"), ["ubuntu-browser"]
        )
        self.assertEqual(
            publish.tags("ubuntu-browser", "date-sha", "ubuntu-browser", ""),
            ["ubuntu-browser", "latest"],
        )
        with self.assertRaises(ValueError):
            publish.tags("ubuntu", "$(command)", "ubuntu", "t3code")

    def test_one_failed_architecture_does_not_tag_a_variant(self) -> None:
        with tempfile.TemporaryDirectory() as directory:
            root = Path(directory)
            (root / "digests").mkdir()
            for name in ("ubuntu-amd64", "ubuntu-arm64", "ubuntu-browser-amd64"):
                (root / "digests" / name).write_text(D1)
            with (
                patch.dict(
                    os.environ,
                    {
                        "GITHUB_REF": "refs/heads/main",
                        "GITHUB_EVENT_NAME": "push",
                        "IMAGE": "t3code",
                        "REPO": GHCR,
                        "GHCR": GHCR,
                        "VERSION": "0.0.42",
                        "VARIANTS": '[{"variant":"ubuntu"},{"variant":"ubuntu-browser"}]',
                        "RUNNER_TEMP": directory,
                        "LATEST_VARIANT": "ubuntu",
                        "VERSION_PREFIX": "t3code",
                    },
                ),
                patch("publish.run") as run,
                patch(
                    "publish.inspect",
                    side_effect=[index(arches=("amd64",)), index(arches=("arm64",)), index()],
                ),
                patch("publish.summary"),
            ):
                self.assertEqual(publish.main(), 1)
            creates = [call for call in run.call_args_list if call.args[0][0] == "docker"]
            self.assertEqual(len(creates), 1)
            self.assertFalse(
                any("ubuntu-browser" in argument for call in creates for argument in call.args[0])
            )

    def test_wrong_architecture_artifact_is_rejected_before_tagging(self) -> None:
        with (
            patch("publish.inspect", return_value=index(arches=("arm64",))),
            self.assertRaisesRegex(ValueError, "expected only linux/amd64"),
        ):
            publish.validate_sources([f"{GHCR}/t3code@{D1}", f"{GHCR}/t3code@{D2}"])


class WorkflowContractTests(unittest.TestCase):
    def test_job_graph_permissions_and_script_entry_points(self) -> None:
        workflow = yaml.safe_load((ROOT / ".github/workflows/tool-image.yml").read_text())
        jobs = workflow["jobs"]
        self.assertEqual(set(jobs), {"plan", "build", "publish", "dependents"})
        self.assertEqual(jobs["build"]["needs"], "plan")
        self.assertEqual(jobs["publish"]["needs"], ["plan", "build"])
        self.assertFalse(jobs["build"]["strategy"]["fail-fast"])
        self.assertEqual(len(jobs["publish"]["strategy"]["matrix"]["include"]), 2)
        self.assertEqual(workflow["permissions"], {})
        self.assertNotIn("packages", jobs["plan"]["permissions"])
        for job in jobs.values():
            for step in job["steps"]:
                if "run" in step:
                    self.assertNotIn("\n", step["run"].strip())
                    self.assertTrue(step["run"].startswith("python3 .github/scripts/"), step)
        for path in (ROOT / ".github/workflows").glob("*.yml"):
            if path.name.startswith(("ai-", "base-")):
                caller = yaml.safe_load(path.read_text())
                inputs = caller["jobs"]["image"]["with"]
                self.assertIn("latest-variant", inputs)
                self.assertNotIn("tags", inputs)
                self.assertIn(".github/scripts/**", caller[True]["pull_request"]["paths"])


if __name__ == "__main__":
    unittest.main()
