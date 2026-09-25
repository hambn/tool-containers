package graph

import (
	"fmt"
	"slices"
	"testing"
)

func fixture() Graph {
	g := Graph{Group: map[string]struct {
		Targets []string `json:"targets"`
	}{"all": {Targets: []string{"base", "agents", "ci"}}, "base": {Targets: []string{"core"}}, "agents": {Targets: []string{"agent-ubuntu", "agent-alpine"}}, "ci": {Targets: []string{"new-ubuntu", "new-alpine"}}}, Target: map[string]Target{}}
	g.Target["core"] = Target{Context: "src/tools/base/core"}
	g.Target["layer1"] = Target{Context: "src/tools/base/devbox", Contexts: map[string]string{"base": "target:core"}}
	g.Target["layer2"] = Target{Context: "src/tools/base/devbox", Contexts: map[string]string{"base": "target:layer1"}}
	g.Target["agent-ubuntu"] = Target{Context: "src/tools/ai/agent", Contexts: map[string]string{"base": "target:layer2"}}
	g.Target["agent-alpine"] = Target{Context: "src/tools/ai/agent", Contexts: map[string]string{"base": "target:layer2"}}
	g.Target["new-ubuntu"] = Target{Context: "src/tools/ci/new", Contexts: map[string]string{"base": "target:agent-ubuntu"}}
	g.Target["new-alpine"] = Target{Context: "src/tools/ci/new", Contexts: map[string]string{"base": "target:agent-alpine"}}
	return g
}
func TestNewCategoryVariantsAndDeepDependencies(t *testing.T) {
	g := fixture()
	p, err := g.Select(&g, []string{"src/tools/base/core/Dockerfile"}, "pull_request", nil, 16)
	if err != nil {
		t.Fatal(err)
	}
	want := []string{"core", "agent-ubuntu", "agent-alpine", "new-ubuntu", "new-alpine"}
	if !slices.Equal(p.Targets, want) {
		t.Fatalf("got %v want %v", p.Targets, want)
	}
	if len(p.Jobs) != 3 || p.Jobs[2].Name != "ci/new" {
		t.Fatalf("unexpected jobs %+v", p.Jobs)
	}
}
func TestDocumentationOnlyDoesNotBuild(t *testing.T) {
	g := fixture()
	p, err := g.Select(&g, []string{"README.md", "src/tools/ci/new/README.md", "src/tools/ci/new/examples/docker/run.sh"}, "pull_request", nil, 16)
	if err != nil {
		t.Fatal(err)
	}
	if len(p.Targets) != 0 || len(p.Jobs) != 0 {
		t.Fatalf("documentation planned builds: %+v", p)
	}
}
func TestNewCategoryAndChangedVariant(t *testing.T) {
	base := fixture()
	delete(base.Target, "new-ubuntu")
	delete(base.Target, "new-alpine")
	g := fixture()
	p, err := g.Select(&base, []string{"src/tools/docker-bake.hcl"}, "pull_request", nil, 16)
	if err != nil {
		t.Fatal(err)
	}
	if !slices.Contains(p.Targets, "new-ubuntu") || !slices.Contains(p.Targets, "new-alpine") {
		t.Fatal(p.Targets)
	}
}
func TestBoundedPackingAndDispatch(t *testing.T) {
	g := fixture()
	p, err := g.Select(nil, nil, "workflow_dispatch", []string{"all"}, 2)
	if err != nil {
		t.Fatal(err)
	}
	if len(p.Jobs) != 2 {
		t.Fatalf("got %d jobs", len(p.Jobs))
	}
	if _, err := g.Select(nil, nil, "workflow_dispatch", []string{"layer2"}, 16); err == nil {
		t.Fatal("internal target was accepted")
	}
}
func TestDependencyCycleFails(t *testing.T) {
	g := fixture()
	tgt := g.Target["core"]
	tgt.Contexts = map[string]string{"base": "target:layer2"}
	g.Target["core"] = tgt
	if _, err := g.Select(&g, []string{"src/tools/base/core/Dockerfile"}, "pull_request", nil, 16); err == nil {
		t.Fatal("cycle accepted")
	}
}
func TestRenderedBakeObjectsAndMetadataOnly(t *testing.T) {
	data := []byte(`{"group":{"all":{"targets":["x"]}},"target":{"x":{"context":"src/tools/ci/new","cache-from":[{"type":"registry","ref":"cache:amd64"}],"cache-to":[{"type":"registry"}],"output":[{"type":"cacheonly"}],"tags":["ghcr.io/hambn/new:latest"],"labels":{"org.opencontainers.image.revision":"new"}}}}`)
	g, err := Parse(data)
	if err != nil {
		t.Fatal(err)
	}
	base, err := Parse(data)
	if err != nil {
		t.Fatal(err)
	}
	value := g.Target["x"]
	value.Labels["org.opencontainers.image.revision"] = "changed"
	value.Tags = []string{"ghcr.io/hambn/new:other"}
	g.Target["x"] = value
	p, err := g.Select(&base, nil, "pull_request", nil, 16)
	if err != nil {
		t.Fatal(err)
	}
	if len(p.Targets) != 0 {
		t.Fatal("metadata-only change rebuilt target")
	}
	if g.Target["x"].Labels["org.opencontainers.image.revision"] != "changed" {
		t.Fatal("normalization mutated graph")
	}
}
func TestManyToolsStayWithinRunnerBudget(t *testing.T) {
	g := Graph{Target: map[string]Target{}}
	var published []string
	for i := 0; i < 29; i++ {
		name := fmt.Sprintf("tool-%02d", i)
		g.Target[name] = Target{Context: fmt.Sprintf("src/tools/ci/%s", name)}
		published = append(published, name)
	}
	g.Group = map[string]struct {
		Targets []string `json:"targets"`
	}{"all": {Targets: published}}
	p, err := g.Select(nil, nil, "workflow_dispatch", []string{"all"}, 16)
	if err != nil {
		t.Fatal(err)
	}
	if len(p.Jobs) != 16 {
		t.Fatalf("got %d jobs for %d tools", len(p.Jobs), len(published))
	}
	seen := map[string]bool{}
	for _, job := range p.Jobs {
		for _, target := range job.Targets {
			if seen[target] {
				t.Fatalf("target %s built twice", target)
			}
			seen[target] = true
		}
	}
	if len(seen) != len(published) {
		t.Fatalf("planned %d of %d targets", len(seen), len(published))
	}
}
