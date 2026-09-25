package bake

import (
	"context"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"testing"

	"github.com/hambn/tool-containers/src/ci/internal/run"
)

// graph is a synthetic rendering with a category ("ci") that the repository does not
// have, nested groups, two variants, and a four-level dependency chain.
const graph = `{
  "group": {
    "all": {"targets": ["base", "ci"]},
    "base": {"targets": ["core"]},
    "ci": {"targets": ["runner"]},
    "core": {"targets": ["core-alpine", "core-ubuntu"]},
    "runner": {"targets": ["runner-ubuntu"]}
  },
  "target": {
    "core-alpine":   {"context": "src/tools/base/core", "tags": ["ghcr.io/o/core:alpine", "docker.io/o/core:alpine"]},
    "core-ubuntu":   {"context": "src/tools/base/core", "tags": ["ghcr.io/o/core:ubuntu"]},
    "payload":       {"context": "src/tools/base/devbox", "contexts": {"core": "target:core-ubuntu"}},
    "config":        {"context": "src/tools/base/devbox"},
    "runner-ubuntu": {"context": "src/tools/ci/runner", "target": "image",
                      "contexts": {"base": "target:payload", "config": "target:config", "extra": "docker-image://x"},
                      "tags": ["registry.local:5000/o/runner:1"]}
  }
}`

func mustParse(t *testing.T, data string) *Definition {
	t.Helper()
	d, err := Parse([]byte(data))
	if err != nil {
		t.Fatal(err)
	}
	return d
}

func TestPublishedExpandsNestedGroupsInOrder(t *testing.T) {
	t.Parallel()
	got, err := mustParse(t, graph).Published()
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"core-alpine", "core-ubuntu", "runner-ubuntu"}
	if !slices.Equal(got, want) {
		t.Fatalf("Published() = %v, want %v", got, want)
	}
}

func TestClosureOrdersDependenciesFirstToAnyDepth(t *testing.T) {
	t.Parallel()
	got, err := mustParse(t, graph).Closure("runner-ubuntu")
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"config", "core-ubuntu", "payload", "runner-ubuntu"}
	if !slices.Equal(got, want) {
		t.Fatalf("Closure() = %v, want %v", got, want)
	}
}

func TestToolDirAndRepository(t *testing.T) {
	t.Parallel()
	d := mustParse(t, graph)
	runner := d.Targets["runner-ubuntu"]
	if dir, err := runner.ToolDir(); err != nil || dir != "src/tools/ci/runner" {
		t.Fatalf("ToolDir() = %q, %v", dir, err)
	}
	// The registry port must not be mistaken for a tag separator.
	if repo, err := runner.Repository(); err != nil || repo != "runner" {
		t.Fatalf("Repository() = %q, %v", repo, err)
	}
	if _, err := d.Targets["payload"].Repository(); err == nil {
		t.Fatal("an untagged internal target must have no repository")
	}
}

func TestToolDirRejectsContextsOutsideTheToolLayout(t *testing.T) {
	t.Parallel()
	for _, ctx := range []string{".", "src/tools", "src/tools/base", "src/tools/base/core/sub", "src/tools/../x/y", "tools/base/core"} {
		tgt := &Target{Name: "x", Context: ctx}
		if dir, err := tgt.ToolDir(); err == nil {
			t.Errorf("ToolDir(%q) = %q, want error", ctx, dir)
		}
	}
}

func TestParseRejectsBrokenGraphs(t *testing.T) {
	t.Parallel()
	tests := map[string]string{
		"dangling dependency": `{"target": {"a": {"contexts": {"b": "target:missing"}}}}`,
		"no targets":          `{"group": {"all": {"targets": []}}}`,
		"not json":            `#1 [internal] load local bake definitions`,
	}
	for name, data := range tests {
		t.Run(name, func(t *testing.T) {
			t.Parallel()
			if _, err := Parse([]byte(data)); err == nil {
				t.Fatal("Parse succeeded")
			}
		})
	}
}

func TestCyclesAreReportedWithTheirPath(t *testing.T) {
	t.Parallel()
	d := mustParse(t, `{
	  "group": {"all": {"targets": ["g"]}, "g": {"targets": ["all"]}},
	  "target": {"a": {"contexts": {"x": "target:b"}}, "b": {"contexts": {"x": "target:a"}}}
	}`)
	if _, err := d.Published(); err == nil || !strings.Contains(err.Error(), "all -> g -> all") {
		t.Fatalf("Published() error = %v", err)
	}
	if _, err := d.Closure("a"); err == nil || !strings.Contains(err.Error(), "a -> b -> a") {
		t.Fatalf("Closure() error = %v", err)
	}
}

func TestRawKeepsAttributesThisPackageDoesNotName(t *testing.T) {
	t.Parallel()
	d := mustParse(t, `{"target": {"a": {"context": "c", "secret": ["id=npm"]}}}`)
	if !strings.Contains(string(d.Targets["a"].Raw), `"secret"`) {
		t.Fatalf("Raw = %s", d.Targets["a"].Raw)
	}
}

// TestRepositoryGraphHonorsTheContract renders the real Bake files. It is the check
// that keeps src/tools consumable by CI: every published target belongs to a tool
// directory, is tagged for exactly one repository, and carries the labels tests use.
func TestRepositoryGraphHonorsTheContract(t *testing.T) {
	if _, err := exec.LookPath("docker"); err != nil {
		t.Skip("docker is not installed")
	}
	root, err := filepath.Abs("../../../..")
	if err != nil {
		t.Fatal(err)
	}
	d, err := Renderer{Runner: run.Exec{}, Root: root}.Render(context.Background(), nil, PublishedGroup)
	if err != nil {
		t.Fatal(err)
	}
	published, err := d.Published()
	if err != nil {
		t.Fatal(err)
	}
	if _, err := d.Closure(published...); err != nil {
		t.Fatal(err)
	}
	for _, name := range published {
		tgt := d.Targets[name]
		if _, err := tgt.ToolDir(); err != nil {
			t.Error(err)
		}
		if _, err := tgt.Repository(); err != nil {
			t.Error(err)
		}
		for _, label := range []string{LabelDistro, LabelTier, LabelVariant, LabelTitle} {
			if tgt.Labels[label] == "" {
				t.Errorf("published target %s lacks label %s", name, label)
			}
		}
	}
}
