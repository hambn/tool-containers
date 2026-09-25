#!/usr/bin/env python3
"""Exercise build-tool.sh with fake executables; no builds or network calls."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("build-tool.sh").resolve()

# Two variants of ai/sample, built on an internal payload from tools/base/box.
BAKE = {"target": {
    "box-payload": {"context": "tools/base/box"},
    **{
        f"sample-{variant}": {
            "context": "tools/ai/sample",
            "contexts": {"base": "target:box-payload"},
            "tags": [f"ghcr.io/hambn/sample:{variant}", f"docker.io/hambn/sample:{variant}"],
            "labels": {"io.github.hambn.containers.distro": "ubuntu",
                       "io.github.hambn.containers.tier": "agent",
                       "io.github.hambn.containers.variant": variant},
        }
        for variant in ("ubuntu", "browser")
    },
}}

FAKE_TOOL = r'''#!/usr/bin/env python3
import json
import os
from pathlib import Path
import sys

name = Path(sys.argv[0]).name
args = sys.argv[1:]
with open(os.environ["CALL_LOG"], "a") as handle:
    handle.write(json.dumps({"tool": name, "args": args, "platform": os.getenv("PLATFORM")}) + "\n")
if name == "docker" and "--print" in args:
    print(os.environ["BAKE_JSON"])
if name == "container-structure-test" and os.getenv("FAIL_TEST"):
    sys.exit(1)
if name == "trivy" and "--exit-code" in args and os.getenv("FAIL_SCAN"):
    sys.exit(1)
if name == "trivy" and "--output" in args:
    Path(args[args.index("--output") + 1]).write_text('{"version":"2.1.0","runs":[{}]}')
if name == "docker" and "--metadata-file" in args:
    targets = [a for a in args if a.startswith("sample-")]
    Path(args[args.index("--metadata-file") + 1]).write_text(json.dumps(
        {t: {"containerimage.digest": "sha256:" + "a" * 64} for t in targets}))
'''


def bake_calls(calls):
    return [c["args"] for c in calls if c["tool"] == "docker" and c["args"][:2] == ["buildx", "bake"] and "--print" not in c["args"]]


class BuildToolTests(unittest.TestCase):
    def run_script(self, **overrides):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            binaries = root / "bin"
            binaries.mkdir()
            for name in ("docker", "container-structure-test", "trivy", "smoke.sh"):
                path = binaries / name
                path.write_text(FAKE_TOOL)
                path.chmod(0o755)
            tests = root / "tools/ai/sample/tests"
            tests.mkdir(parents=True)
            (tests / "structure.yaml").write_text("schemaVersion: 2.0.0\n")
            (tests / "structure-ubuntu.yaml").write_text("schemaVersion: 2.0.0\n")
            (tests / "smoke.sh").symlink_to(binaries / "smoke.sh")
            (tests / "trivy-skip-files.txt").write_text("# comment\n**/sample-bin  # trailing\n\n")
            box = root / "tools/base/box/tests"
            box.mkdir(parents=True)
            (box / "trivy-skip-files.txt").write_text("**/usr/local/bin/box\n")
            log = root / "calls.jsonl"
            results = root / "results"
            env = {
                **os.environ,
                "PATH": f"{binaries}:{os.environ['PATH']}",
                "CALL_LOG": str(log), "RESULT_DIR": str(results), "BAKE_JSON": json.dumps(BAKE),
                "TARGETS": '["sample-ubuntu", "sample-browser"]', "ARCH": "arm64",
                "SCAN": "false", "PR_BUILD": "true", "PUBLISH": "false",
                **overrides,
            }
            result = subprocess.run(["bash", str(SCRIPT)], cwd=root, env=env, text=True, capture_output=True)
            calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            digests = sorted(path.name for path in results.glob("digests/*"))
            return result, calls, digests

    def test_variants_build_together_then_test_one_at_a_time(self):
        result, calls, digests = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        build, *loads = bake_calls(calls)
        self.assertEqual(build[-2:], ["sample-ubuntu", "sample-browser"])
        self.assertIn("sample-ubuntu.output=type=cacheonly", build)
        self.assertIn("sample-browser.cache-to=type=gha,version=2,scope=sample-browser-arm64,mode=max,timeout=5m,ignore-error=true", build)
        self.assertEqual([load[6] for load in loads], ["sample-ubuntu", "sample-browser"])
        self.assertTrue(all(c["platform"] == "linux/arm64" for c in calls))
        structure = [c["args"] for c in calls if c["tool"] == "container-structure-test"]
        self.assertEqual(len(structure), 2)
        self.assertEqual(structure[0].count("tools/ai/sample/tests/structure-ubuntu.yaml"), 1)
        self.assertEqual(len([c for c in calls if c["tool"] == "smoke.sh"]), 2)
        self.assertFalse(any(c["tool"] == "trivy" for c in calls))
        self.assertEqual(len([c for c in calls if c["args"][:2] == ["image", "rm"]]), 2)
        self.assertEqual(digests, [])

    def test_scan_gate_skips_files_listed_by_the_tool_and_its_bases(self):
        result, calls, _ = self.run_script(SCAN="true")
        self.assertEqual(result.returncode, 0, result.stderr)
        gate = [c["args"] for c in calls if c["tool"] == "trivy" and "--exit-code" in c["args"]]
        self.assertEqual(len(gate), 2)
        skips = [gate[0][i + 1] for i, arg in enumerate(gate[0]) if arg == "--skip-files"]
        self.assertEqual(skips, ["**/sample-bin", "**/usr/local/bin/box"])
        report = [c["args"] for c in calls if c["tool"] == "trivy" and "--output" in c["args"]]
        self.assertNotIn("--skip-files", report[0])

    def test_publish_pushes_all_variants_after_tests(self):
        result, calls, digests = self.run_script(PR_BUILD="false", PUBLISH="true")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(digests, ["sample-browser-arm64", "sample-ubuntu-arm64"])
        push = bake_calls(calls)[-1]
        self.assertIn("sample-ubuntu.output=type=image,name=ghcr.io/hambn/sample,push-by-digest=true,name-canonical=true,push=true,rewrite-timestamp=true", push)
        self.assertFalse(any("type=gha" in arg for args in bake_calls(calls) for arg in args))

    def test_failed_test_or_scan_stops_before_push(self):
        for failure in ({"FAIL_TEST": "1"}, {"SCAN": "true", "FAIL_SCAN": "1"}):
            with self.subTest(failure=failure):
                result, calls, digests = self.run_script(PUBLISH="true", **failure)
                self.assertNotEqual(result.returncode, 0)
                self.assertFalse(any("--metadata-file" in args for args in bake_calls(calls)))
                self.assertEqual(digests, [])

    def test_invalid_input_fails_before_invoking_tools(self):
        for override in ({"TARGETS": "[]"}, {"TARGETS": '["bad;target"]'}, {"TARGETS": '"sample-ubuntu"'}, {"ARCH": ""}):
            with self.subTest(override=override):
                result, calls, _ = self.run_script(**override)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(calls, [])


if __name__ == "__main__":
    unittest.main()
