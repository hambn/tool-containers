#!/usr/bin/env python3
"""Selection regressions for the published image graph."""

import importlib.util
import datetime as dt
from pathlib import Path
import unittest
from unittest.mock import patch


SPEC = importlib.util.spec_from_file_location("image_plan", Path(__file__).with_name("image_plan.py"))
image_plan = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(image_plan)


class ImagePlanTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.images = image_plan.load_catalog()

    def test_zsh_visual_change_stays_in_full_workspaces(self):
        selected = image_plan.affected(
            self.images, {"tools/dev/workspace/images/common/zshrc"}
        )
        self.assertEqual(selected, {
            "workspace-alpine-3.21-full", "workspace-ubuntu-24.04-full"
        })

    def test_runtime_package_change_selects_descendants(self):
        selected = image_plan.affected(
            self.images, {"tools/base/runtime/images/ubuntu-minimal/Dockerfile"}
        )
        self.assertIn("runtime-ubuntu-24.04-minimal", selected)
        self.assertIn("workspace-ubuntu-24.04-core", selected)
        self.assertIn("codex-ubuntu-24.04", selected)
        self.assertNotIn("runtime-alpine-3.21-minimal", selected)

    def test_browser_change_does_not_select_plain_agents(self):
        selected = image_plan.affected(
            self.images, {"tools/ai/t3code/images/ubuntu-24.04-browser/Dockerfile"}
        )
        self.assertEqual(selected, {"t3code-ubuntu-24.04-browser"})

    def test_agent_change_selects_bundle_consumers(self):
        selected = image_plan.affected(
            self.images, {"tools/ai/agentbloat/images/ubuntu-24.04/Dockerfile"}
        )
        self.assertEqual(selected, {
            "agentbloat-ubuntu-24.04", "agentbloat-ubuntu-24.04-browser",
            "omnigent-ubuntu-24.04", "t3code-ubuntu-24.04",
            "t3code-ubuntu-24.04-browser",
        })

    def test_catalog_change_selects_every_image(self):
        selected = image_plan.affected(self.images, {".github/image-catalog.json"})
        self.assertEqual(selected, {image["id"] for image in self.images})

    def test_daily_version_change_selects_only_its_consumers(self):
        now = dt.datetime(2026, 9, 25, tzinfo=dt.timezone.utc)
        previous = {}

        def inspect(ref, template):
            if template == "{{.Manifest.Digest}}":
                return "sha256:" + "a" * 64
            return previous.get(ref)

        with patch.object(image_plan, "inspect", side_effect=inspect), \
             patch.object(image_plan, "version", return_value="1.0.0"):
            first = image_plan.resolve(self.images, "hambn", now)
        previous.update({
            f"ghcr.io/hambn/{image['product']}:{image['tag']}": image["fingerprint"]
            for image in first
        })
        with patch.object(image_plan, "inspect", side_effect=inspect), \
             patch.object(image_plan, "version", side_effect=lambda source: "2.0.0" if source["name"] == "t3" else "1.0.0"):
            second = image_plan.resolve(self.images, "hambn", now)
        self.assertEqual(
            {image["id"] for image in second if image["selected"]},
            {"t3code-ubuntu-24.04", "t3code-ubuntu-24.04-browser"},
        )


if __name__ == "__main__":
    unittest.main()
