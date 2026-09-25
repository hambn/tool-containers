#!/usr/bin/env python3
"""Check promotion and exception safety without accessing a registry."""

import datetime as dt
import importlib.util
import json
from pathlib import Path
from types import SimpleNamespace
import unittest
from unittest.mock import patch


def module(name):
    spec = importlib.util.spec_from_file_location(name, Path(__file__).with_name(name + ".py"))
    loaded = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(loaded)
    return loaded


promotion = module("image_promote")
exceptions = module("image_scan_exceptions")


class ReleaseTests(unittest.TestCase):
    def test_cross_registry_copy_preserves_digest(self):
        expected = "sha256:" + "a" * 64
        with patch.object(promotion, "inspect", side_effect=[None, expected]), \
             patch.object(promotion.subprocess, "run") as command:
            self.assertEqual(promotion.copy_to_dockerhub("docker.io/hambn/runtime:build", "ghcr.io/hambn/runtime@" + expected, expected), expected)
        self.assertEqual(command.call_args.args[0][:4],
                         ["skopeo", "copy", "--all", "--preserve-digests"])

    def test_cross_registry_copy_rejects_changed_digest(self):
        with patch.object(promotion, "inspect", side_effect=[None, "sha256:wrong"]), \
             patch.object(promotion.subprocess, "run"):
            with self.assertRaisesRegex(RuntimeError, "digest differs"):
                promotion.copy_to_dockerhub("docker.io/hambn/runtime:build", "ghcr.io/hambn/runtime@sha256:good", "sha256:good")

    def test_expired_exception_blocks_release(self):
        record = {"image": "runtime-ubuntu-24.04-minimal", "id": "CVE-2026-12345",
                  "reason": "Upstream package patch pending", "owner": "@maintainer",
                  "expires": "2026-09-24"}
        with patch.object(exceptions, "EXCEPTIONS", SimpleNamespace(read_text=lambda: json.dumps([record]))):
            with self.assertRaisesRegex(ValueError, "expired exception"):
                exceptions.entries(dt.date(2026, 9, 25))


if __name__ == "__main__":
    unittest.main()
