#!/usr/bin/env python3
"""Exercise per-tool CI orchestration with fake tools; no builds or network calls."""

import json
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("build-tool.sh").resolve()
FAKE_TOOL = r'''#!/usr/bin/env python3
import json
import os
from pathlib import Path
import sys

name = Path(sys.argv[0]).name
args = sys.argv[1:]
record = {"tool": name, "args": args, "arch": os.getenv("ARCH"),
          "platform": os.getenv("PLATFORM"), "docker_platform": os.getenv("DOCKER_DEFAULT_PLATFORM")}
with open(os.environ["CALL_LOG"], "a") as handle:
    handle.write(json.dumps(record) + "\n")
if name == "docker" and "--print" in args:
    target = args[-1]
    print(json.dumps({"target": {target: {
        "context": "tools/ai/sample", "tags": ["ghcr.io/hambn/sample:test"],
        "labels": {"io.github.hambn.containers.distro": "ubuntu",
                   "io.github.hambn.containers.tier": "agent",
                   "io.github.hambn.containers.variant": "ubuntu"}
    }}}))
if name == "container-structure-test" and os.getenv("FAIL_ARCH") == os.getenv("ARCH"):
    sys.exit(1)
if name == "trivy" and "--exit-code" in args and os.getenv("FAIL_SCAN"):
    sys.exit(1)
if name == "trivy" and "--output" in args:
    Path(args[args.index("--output") + 1]).write_text('{"version":"2.1.0","runs":[]}')
if name == "docker" and "--metadata-file" in args:
    target = args[6]
    Path(args[args.index("--metadata-file") + 1]).write_text(json.dumps({
        target: {"containerimage.digest": "sha256:" + "a" * 64}}))
'''


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
            test_dir = root / "tools/ai/sample/tests"
            test_dir.mkdir(parents=True)
            (test_dir / "structure.yaml").write_text("schemaVersion: 2.0.0\n")
            (test_dir / "structure-ubuntu.yaml").write_text("schemaVersion: 2.0.0\n")
            (test_dir / "smoke.sh").symlink_to(binaries / "smoke.sh")
            log = root / "calls.jsonl"
            results = root / "results"
            env = {
                **os.environ,
                "PATH": f"{binaries}:{os.environ['PATH']}",
                "CALL_LOG": str(log), "RESULT_DIR": str(results),
                "TARGETS": '["sample-ubuntu", "sample-browser"]',
                "PR_BUILD": "true", "PUBLISH": "false", "FAIL_ARCH": "", "FAIL_SCAN": "",
                **overrides,
            }
            result = subprocess.run(["bash", str(SCRIPT)], cwd=root, env=env, text=True, capture_output=True)
            calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            digests = sorted(path.name for path in results.glob("digests/*"))
            return result, calls, digests

    def test_both_architectures_and_variants_share_one_job(self):
        result, calls, digests = self.run_script()
        self.assertEqual(result.returncode, 0, result.stderr)
        builds = [c for c in calls if "--provenance=false" in c["args"]]
        self.assertEqual([c["arch"] for c in builds], ["amd64", "arm64", "amd64", "arm64"])
        self.assertEqual(len([c for c in calls if c["tool"] == "container-structure-test"]), 4)
        self.assertEqual(len([c for c in calls if c["tool"] == "smoke.sh"]), 4)
        for call in builds:
            self.assertEqual(call["platform"], f"linux/{call['arch']}")
            self.assertEqual(call["docker_platform"], call["platform"])
            self.assertTrue(any("cache-to=type=gha" in arg for arg in call["args"]))
        for call in calls:
            if call["tool"] == "trivy":
                self.assertEqual(call["arch"], "amd64")
            if call["tool"] == "container-structure-test":
                self.assertEqual(call["args"].count("tools/ai/sample/tests/structure-ubuntu.yaml"), 1)
        self.assertEqual(len([c for c in calls if c["args"][:2] == ["image", "rm"]]), 4)
        self.assertEqual(digests, [])

    def test_publish_exports_both_verified_architectures(self):
        result, calls, digests = self.run_script(PR_BUILD="false", PUBLISH="true")
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(digests, ["sample-browser-amd64", "sample-browser-arm64", "sample-ubuntu-amd64", "sample-ubuntu-arm64"])
        self.assertEqual(len([c for c in calls if "--metadata-file" in c["args"]]), 4)
        self.assertFalse(any("type=gha" in arg for c in calls for arg in c["args"]))

    def test_failed_test_stops_before_push(self):
        result, calls, digests = self.run_script(PUBLISH="true", FAIL_ARCH="amd64")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any("--metadata-file" in c["args"] for c in calls))
        self.assertEqual(digests, [])

    def test_failed_scan_stops_before_push(self):
        result, calls, digests = self.run_script(PUBLISH="true", FAIL_SCAN="true")
        self.assertNotEqual(result.returncode, 0)
        self.assertFalse(any("--metadata-file" in c["args"] for c in calls))
        self.assertEqual(digests, [])

    def test_failed_arm_test_cannot_export_arm_digest(self):
        result, calls, digests = self.run_script(PUBLISH="true", FAIL_ARCH="arm64")
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(digests, ["sample-ubuntu-amd64"])
        self.assertFalse(any(c["arch"] == "arm64" and "--metadata-file" in c["args"] for c in calls))

    def test_invalid_target_list_fails_before_invoking_tools(self):
        for targets in ('[]', '["bad;target"]', '"sample-ubuntu"'):
            with self.subTest(targets=targets):
                result, calls, _ = self.run_script(TARGETS=targets)
                self.assertNotEqual(result.returncode, 0)
                self.assertEqual(calls, [])


if __name__ == "__main__":
    unittest.main()
