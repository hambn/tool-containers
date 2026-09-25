#!/usr/bin/env python3
"""Unit tests for the image build planner (no Docker required)."""

import copy
import unittest

from plan import affected_targets, depths, expand, plan


def cache(name):
    return [{"type": "registry", "ref": f"plan:{name}-amd64"}]


def target(context, contexts=None, cache_from=None, cache_to=True, name=None, **args):
    definition = {
        "context": context,
        "dockerfile": "Dockerfile",
        "args": args,
        "labels": {"org.opencontainers.image.revision": "0" * 40},
        "cache-from": cache(cache_from or name),
    }
    if contexts:
        definition["contexts"] = {key: f"target:{value}" for key, value in contexts.items()}
    if cache_to:
        definition["cache-to"] = cache(name)
    return definition


FIXTURE = {
    "group": {
        "all": {"targets": ["base", "agents"]},
        "base": {"targets": ["core", "devbox"]},
        "agents": {"targets": ["bloat-ubuntu", "claude-ubuntu", "omni-ubuntu"]},
        "core": {"targets": ["core-ubuntu"]},
        "devbox": {"targets": ["devbox-ubuntu-full"]},
    },
    "target": {
        "core-ubuntu": target("tools/base/core", name="core-ubuntu"),
        "devbox-ubuntu-full": target(
            "tools/base/devbox", {"core": "core-ubuntu"}, name="devbox-ubuntu-full"
        ),
        "devbox-payload-ubuntu-full": target(
            "tools/base/devbox", {"core": "core-ubuntu"}, cache_from="devbox-ubuntu-full", cache_to=False
        ),
        "devbox-config": target("tools/base/devbox", name="devbox-config"),
        "claude-ubuntu": target(
            "tools/ai/claude",
            {"base": "devbox-payload-ubuntu-full", "devbox-config": "devbox-config"},
            name="claude-ubuntu",
            CLAUDE_VERSION="1.0.0",
        ),
        "bloat-ubuntu": target(
            "tools/ai/bloat",
            {"base": "devbox-payload-ubuntu-full", "devbox-config": "devbox-config"},
            name="bloat-ubuntu",
        ),
        "bloat-payload-ubuntu": target(
            "tools/ai/bloat",
            {"base": "devbox-payload-ubuntu-full", "devbox-config": "devbox-config"},
            cache_from="bloat-ubuntu",
            cache_to=False,
        ),
        "omni-ubuntu": target(
            "tools/ai/omni",
            {"base": "bloat-payload-ubuntu", "devbox-config": "devbox-config"},
            name="omni-ubuntu",
        ),
    },
}
PUBLISHED = ["core-ubuntu", "devbox-ubuntu-full", "bloat-ubuntu", "claude-ubuntu", "omni-ubuntu"]


def published_affected(changed, head=FIXTURE, base=FIXTURE):
    return sorted(affected_targets(head, base, changed) & set(PUBLISHED))


class PlanTests(unittest.TestCase):
    def test_expand_groups(self):
        self.assertEqual(expand(FIXTURE, ["all"]), PUBLISHED)
        with self.assertRaises(ValueError):
            expand(FIXTURE, ["missing"])

    def test_waves_follow_cache_sharing_edges(self):
        self.assertEqual(
            depths(FIXTURE, PUBLISHED),
            {"core-ubuntu": 0, "devbox-ubuntu-full": 0, "bloat-ubuntu": 1, "claude-ubuntu": 1, "omni-ubuntu": 2},
        )

    def test_context_change_propagates_to_dependents(self):
        self.assertEqual(published_affected(["tools/base/core/Dockerfile"]), sorted(PUBLISHED))
        self.assertEqual(published_affected(["tools/ai/bloat/Dockerfile"]), ["bloat-ubuntu", "omni-ubuntu"])
        self.assertEqual(published_affected(["tools/ai/claude/tests/structure.yaml"]), ["claude-ubuntu"])

    def test_docs_and_examples_do_not_rebuild(self):
        changed = ["tools/ai/claude/README.md", "tools/ai/claude/examples/docker/run.sh", "README.md"]
        self.assertEqual(published_affected(changed), [])

    def test_definition_change_is_detected(self):
        head = copy.deepcopy(FIXTURE)
        head["target"]["claude-ubuntu"]["args"]["CLAUDE_VERSION"] = "1.0.1"
        head["target"]["core-ubuntu"]["labels"]["org.opencontainers.image.revision"] = "1" * 40
        self.assertEqual(published_affected(["versions.hcl"], head=head), ["claude-ubuntu"])

    def test_pipeline_change_or_missing_base_rebuilds_everything(self):
        self.assertEqual(published_affected([".github/workflows/images.yml"]), sorted(PUBLISHED))
        self.assertEqual(published_affected(["docker-bake.hcl"], base=None), sorted(PUBLISHED))

    def test_dispatch_selects_named_published_targets(self):
        result = plan(FIXTURE, None, [], "workflow_dispatch", ["claude-ubuntu", "core"])
        self.assertEqual(result["waves"], [["core-ubuntu"], ["claude-ubuntu"], []])
        with self.assertRaises(ValueError):
            plan(FIXTURE, None, [], "workflow_dispatch", ["devbox-config"])

    def test_pull_request_plan(self):
        result = plan(FIXTURE, FIXTURE, ["tools/ai/omni/Dockerfile"], "pull_request", [])
        self.assertEqual(result, {"waves": [[], [], ["omni-ubuntu"]], "targets": ["omni-ubuntu"]})


if __name__ == "__main__":
    unittest.main()
