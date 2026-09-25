// Package bake reads the image build graph that Docker Buildx Bake renders from
// src/tools/docker-bake.hcl and src/tools/versions.hcl.
//
// The Bake files are the single source of truth for how images are built. CI never
// re-implements them: it renders the graph with `docker buildx bake --print`, decodes
// it here, and derives everything else (published targets, the tool that owns each
// target, dependency order) from that rendering and the src/tools/<category>/<tool>
// layout. Adding a category or tool therefore needs no change to this package.
package bake

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"maps"
	"path"
	"slices"
	"strings"
)

// PublishedGroup is the Bake group whose members CI tests and publishes. Targets
// outside it are internal stages consumed through `target:` contexts.
const PublishedGroup = "all"

// Labels every published target carries; tests and publication key off them.
const (
	LabelDistro  = "io.github.hambn.containers.distro"
	LabelTier    = "io.github.hambn.containers.tier"
	LabelVariant = "io.github.hambn.containers.variant"
	LabelTitle   = "org.opencontainers.image.title"
)

// ToolsDir is where every tool's build context lives, relative to the repository root.
const ToolsDir = "src/tools"

// Definition is the decoded output of `docker buildx bake --print`.
type Definition struct {
	Groups  map[string]Group   `json:"group"`
	Targets map[string]*Target `json:"target"`
}

// Group is a named set of targets or other groups.
type Group struct {
	Targets []string `json:"targets"`
}

// Target is one rendered build. Only the fields CI reads are named; Raw keeps the
// complete rendering so that change detection also sees attributes added later.
type Target struct {
	Name       string            `json:"-"`
	Context    string            `json:"context"`
	Contexts   map[string]string `json:"contexts"`
	Dockerfile string            `json:"dockerfile"`
	Stage      string            `json:"target"`
	Args       map[string]string `json:"args"`
	Labels     map[string]string `json:"labels"`
	Tags       []string          `json:"tags"`
	Raw        json.RawMessage   `json:"-"`
}

func (t *Target) UnmarshalJSON(data []byte) error {
	type plain Target // Drops the method set to avoid recursion.
	if err := json.Unmarshal(data, (*plain)(t)); err != nil {
		return err
	}
	t.Raw = bytes.Clone(data)
	return nil
}

// Parse decodes `docker buildx bake --print` output and checks that every `target:`
// context names a rendered target.
func Parse(data []byte) (*Definition, error) {
	var d Definition
	if err := json.Unmarshal(data, &d); err != nil {
		return nil, fmt.Errorf("decode bake definition: %w", err)
	}
	if len(d.Targets) == 0 {
		return nil, errors.New("bake definition has no targets")
	}
	for name, t := range d.Targets {
		if t == nil {
			return nil, fmt.Errorf("bake target %s is null", name)
		}
		t.Name = name
		for _, dep := range t.Dependencies() {
			if d.Targets[dep] == nil {
				return nil, fmt.Errorf("bake target %s depends on %s, which was not rendered", name, dep)
			}
		}
	}
	return &d, nil
}

// Dependencies returns the targets this target consumes through `target:` named
// contexts, sorted by name.
func (t *Target) Dependencies() []string {
	var deps []string
	for _, value := range t.Contexts {
		if dep, ok := strings.CutPrefix(value, "target:"); ok {
			deps = append(deps, dep)
		}
	}
	slices.Sort(deps)
	return slices.Compact(deps)
}

// ToolDir returns the src/tools/<category>/<tool> directory that owns the target.
func (t *Target) ToolDir() (string, error) {
	dir := path.Clean(t.Context)
	category, tool, ok := strings.Cut(strings.TrimPrefix(dir, ToolsDir+"/"), "/")
	if !strings.HasPrefix(dir, ToolsDir+"/") || !ok || category == ".." || tool == "" || strings.Contains(tool, "/") {
		return "", fmt.Errorf("bake target %s: context %q is not %s/<category>/<tool>", t.Name, t.Context, ToolsDir)
	}
	return dir, nil
}

// Repository returns the registry repository name of a published target: the path
// segment after the namespace in its tags, e.g. "devbox" for ghcr.io/hambn/devbox:x.
func (t *Target) Repository() (string, error) {
	if len(t.Tags) == 0 {
		return "", fmt.Errorf("bake target %s has no tags", t.Name)
	}
	var repo string
	for _, tag := range t.Tags {
		name := tag
		if i := strings.LastIndex(tag, ":"); i > strings.LastIndex(tag, "/") {
			name = tag[:i]
		}
		r := path.Base(name)
		if repo != "" && r != repo {
			return "", fmt.Errorf("bake target %s tags more than one repository: %s and %s", t.Name, repo, r)
		}
		repo = r
	}
	return repo, nil
}

// Expand resolves group and target names to target names, depth first, keeping the
// first occurrence of each target.
func (d *Definition) Expand(names ...string) ([]string, error) {
	var out []string
	seen := map[string]bool{}
	var visit func(name string, stack []string) error
	visit = func(name string, stack []string) error {
		if slices.Contains(stack, name) {
			return fmt.Errorf("bake group cycle: %s", strings.Join(append(stack, name), " -> "))
		}
		if g, ok := d.Groups[name]; ok {
			for _, member := range g.Targets {
				if err := visit(member, append(stack, name)); err != nil {
					return err
				}
			}
			return nil
		}
		if d.Targets[name] == nil {
			return fmt.Errorf("unknown bake target or group %q", name)
		}
		if !seen[name] {
			seen[name] = true
			out = append(out, name)
		}
		return nil
	}
	for _, name := range names {
		if err := visit(name, nil); err != nil {
			return nil, err
		}
	}
	return out, nil
}

// Published returns the members of PublishedGroup in declaration order.
func (d *Definition) Published() ([]string, error) {
	if _, ok := d.Groups[PublishedGroup]; !ok {
		return nil, fmt.Errorf("bake definition has no %q group", PublishedGroup)
	}
	return d.Expand(PublishedGroup)
}

// Closure returns the given targets and everything they depend on, to any depth, in
// dependency order: every target appears after all of its dependencies. Ties are
// broken by name so the order is deterministic.
func (d *Definition) Closure(names ...string) ([]string, error) {
	const (
		visiting = 1
		done     = 2
	)
	state := map[string]int{}
	var order []string
	var visit func(name string, stack []string) error
	visit = func(name string, stack []string) error {
		switch state[name] {
		case done:
			return nil
		case visiting:
			return fmt.Errorf("bake dependency cycle: %s", strings.Join(append(stack, name), " -> "))
		}
		t := d.Targets[name]
		if t == nil {
			return fmt.Errorf("unknown bake target %q", name)
		}
		state[name] = visiting
		for _, dep := range t.Dependencies() {
			if err := visit(dep, append(stack, name)); err != nil {
				return err
			}
		}
		state[name] = done
		order = append(order, name)
		return nil
	}
	for _, name := range slices.Sorted(slices.Values(names)) {
		if err := visit(name, nil); err != nil {
			return nil, err
		}
	}
	return order, nil
}

// Dependents returns, for every target, the targets that consume it directly.
func (d *Definition) Dependents() map[string][]string {
	out := map[string][]string{}
	for _, name := range slices.Sorted(maps.Keys(d.Targets)) {
		for _, dep := range d.Targets[name].Dependencies() {
			out[dep] = append(out[dep], name)
		}
	}
	return out
}
