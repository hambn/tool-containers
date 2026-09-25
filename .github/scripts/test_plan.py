#!/usr/bin/env python3
"""Unit tests for the image build planner (no Docker required)."""

import copy
import unittest

from plan import affected_targets, expand, plan, tool_jobs


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
        self.assertEqual(result["targets"], ["core-ubuntu", "claude-ubuntu"])
        with self.assertRaises(ValueError):
            plan(FIXTURE, None, [], "workflow_dispatch", ["devbox-config"])

    def test_pull_request_plan(self):
        result = plan(FIXTURE, FIXTURE, ["tools/ai/omni/Dockerfile"], "pull_request", [])
        self.assertEqual(result, {"targets": ["omni-ubuntu"]})

    def test_new_tool_and_deep_dependency_chain_need_no_ci_configuration(self):
        head = copy.deepcopy(FIXTURE)
        parent = "omni-ubuntu"
        added = []
        # Each new level has a published image and an untagged payload consumed
        # by the next level. This used to exceed the three hard-coded CI waves.
        for index in range(6):
            name = f"new-tool-{index}"
            context = f"tools/ci/{name}"
            head["target"][name] = target(context, {"base": parent}, name=name)
            payload = f"{name}-payload"
            head["target"][payload] = target(
                context, {"base": parent}, cache_from=name, cache_to=False
            )
            head["group"]["all"]["targets"].append(name)
            added.append(name)
            parent = payload
        result = plan(head, FIXTURE, ["docker-bake.hcl"], "pull_request", [])
        self.assertEqual(result["targets"], added)
        self.assertEqual(
            plan(head, head, ["tools/ci/new-tool-0/Dockerfile"], "push", [])["targets"],
            added,
        )
        self.assertEqual(
            plan(head, None, [], "workflow_dispatch", [added[-1]])["targets"],
            [added[-1]],
        )

    def test_empty_selection(self):
        self.assertEqual(plan(FIXTURE, FIXTURE, [], "pull_request", []), {"targets": []})

    def test_runtime_script_change_selects_all_targets(self):
        for path in (".github/scripts/publish.sh", ".github/scripts/build-tool.sh"):
            with self.subTest(path=path):
                self.assertEqual(
                    plan(FIXTURE, FIXTURE, [path], "push", []),
                    {"targets": PUBLISHED},
                )

    def test_tool_jobs_combine_variants(self):
        head = copy.deepcopy(FIXTURE)
        head["target"]["claude-alpine"] = target("tools/ai/claude", name="claude-alpine")
        self.assertEqual(
            tool_jobs(head, ["claude-ubuntu", "core-ubuntu", "claude-alpine"]),
            [
                {"name": "ai/claude", "artifact": "ai-claude", "targets": ["claude-ubuntu", "claude-alpine"]},
                {"name": "base/core", "artifact": "base-core", "targets": ["core-ubuntu"]},
            ],
        )
        # A pin affecting one variant must not build every variant of that tool.
        self.assertEqual(tool_jobs(head, ["claude-alpine"])[0]["targets"], ["claude-alpine"])
        self.assertEqual(tool_jobs(head, []), [])

    def test_tool_jobs_reject_non_tool_context(self):
        head = copy.deepcopy(FIXTURE)
        head["target"]["core-ubuntu"]["context"] = "."
        with self.assertRaises(ValueError):
            tool_jobs(head, ["core-ubuntu"])


if __name__ == "__main__":
    unittest.main()
