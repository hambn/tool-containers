package graph

import (
	"encoding/json"
	"errors"
	"fmt"
	"path"
	"slices"
	"strings"
)

// Graph is the rendered Docker Buildx Bake graph. Dockerfiles and Bake remain the
// sole definitions of build inputs, dependencies, tags, variants and labels.
type Graph struct {
	Group map[string]struct {
		Targets []string `json:"targets"`
	} `json:"group"`
	Target map[string]Target `json:"target"`
}
type Target struct {
	Context    string            `json:"context"`
	Contexts   map[string]string `json:"contexts"`
	Dockerfile string            `json:"dockerfile"`
	Args       map[string]any    `json:"args"`
	Labels     map[string]string `json:"labels"`
	Tags       []string          `json:"tags"`
	CacheFrom  []any             `json:"cache-from"`
	CacheTo    []any             `json:"cache-to"`
	Output     []any             `json:"output"`
	Platforms  []string          `json:"platforms"`
}
type Job struct {
	ID      string   `json:"id"`
	Name    string   `json:"name"`
	Targets []string `json:"targets"`
}
type Plan struct {
	Targets []string `json:"targets"`
	Jobs    []Job    `json:"jobs"`
}

func Parse(data []byte) (Graph, error) {
	var g Graph
	err := json.Unmarshal(data, &g)
	if err == nil && len(g.Target) == 0 {
		err = errors.New("empty Bake graph")
	}
	return g, err
}
func (g Graph) Expand(names ...string) ([]string, error) {
	var out []string
	seen := map[string]bool{}
	active := map[string]bool{}
	var add func(string) error
	add = func(name string) error {
		if active[name] {
			return fmt.Errorf("Bake group cycle at %s", name)
		}
		if group, ok := g.Group[name]; ok {
			active[name] = true
			for _, member := range group.Targets {
				if err := add(member); err != nil {
					return err
				}
			}
			delete(active, name)
			return nil
		}
		if _, ok := g.Target[name]; !ok {
			return fmt.Errorf("unknown Bake target or group: %s", name)
		}
		if !seen[name] {
			seen[name] = true
			out = append(out, name)
		}
		return nil
	}
	for _, name := range names {
		if err := add(name); err != nil {
			return nil, err
		}
	}
	return out, nil
}
func (g Graph) Published() ([]string, error) { return g.Expand("all") }
func (g Graph) Tool(name string) (string, error) {
	t, ok := g.Target[name]
	if !ok {
		return "", fmt.Errorf("unknown target %s", name)
	}
	parts := strings.Split(path.Clean(t.Context), "/")
	if len(parts) != 4 || parts[0] != "src" || parts[1] != "tools" || parts[2] == "." || parts[3] == "." || strings.Contains(t.Context, "..") {
		return "", fmt.Errorf("%s: expected src/tools/<category>/<tool> context, got %q", name, t.Context)
	}
	return parts[2] + "/" + parts[3], nil
}
func (g Graph) Dependencies(name string) ([]string, error) {
	t, ok := g.Target[name]
	if !ok {
		return nil, fmt.Errorf("unknown target %s", name)
	}
	var deps []string
	for _, v := range t.Contexts {
		if strings.HasPrefix(v, "target:") {
			d := strings.TrimPrefix(v, "target:")
			if _, ok := g.Target[d]; !ok {
				return nil, fmt.Errorf("%s: missing dependency %s", name, d)
			}
			deps = append(deps, d)
		}
	}
	slices.Sort(deps)
	return deps, nil
}
func contextChanged(context string, changed []string) bool {
	p := strings.TrimSuffix(context, "/") + "/"
	for _, file := range changed {
		if !strings.HasPrefix(file, p) {
			continue
		}
		relative := strings.TrimPrefix(file, p)
		if path.Base(relative) == "README.md" || strings.HasPrefix(relative, "examples/") {
			continue
		}
		return true
	}
	return false
}
func normalized(t Target) Target {
	labels := make(map[string]string, len(t.Labels))
	for key, value := range t.Labels {
		labels[key] = value
	}
	t.Labels = labels
	t.Tags = nil
	t.CacheFrom = nil
	t.CacheTo = nil
	t.Output = nil
	t.Platforms = nil
	for _, key := range []string{"org.opencontainers.image.revision", "org.opencontainers.image.created", "org.opencontainers.image.version"} {
		delete(t.Labels, key)
	}
	return t
}
func pipelineChanged(changed []string) bool {
	for _, p := range changed {
		if strings.HasPrefix(p, "src/ci/") || p == ".github/workflows/images.yml" || p == "src/tools/trivyignore.yaml" {
			return true
		}
	}
	return false
}

// Affected follows target contexts recursively, including internal targets.
func (g Graph) Affected(base *Graph, changed []string) (map[string]bool, error) {
	affected := map[string]bool{}
	if base == nil || pipelineChanged(changed) {
		for name := range g.Target {
			affected[name] = true
		}
		return affected, nil
	}
	direct := map[string]bool{}
	for name, t := range g.Target {
		old, ok := base.Target[name]
		a, _ := json.Marshal(normalized(t))
		b, _ := json.Marshal(normalized(old))
		direct[name] = !ok || string(a) != string(b) || contextChanged(t.Context, changed)
	}
	visiting := map[string]bool{}
	var visit func(string) (bool, error)
	visit = func(name string) (bool, error) {
		if visiting[name] {
			return false, fmt.Errorf("Bake target cycle at %s", name)
		}
		if value, ok := affected[name]; ok {
			return value, nil
		}
		visiting[name] = true
		hit := direct[name]
		deps, err := g.Dependencies(name)
		if err != nil {
			return false, err
		}
		for _, dep := range deps {
			v, err := visit(dep)
			if err != nil {
				return false, err
			}
			hit = hit || v
		}
		delete(visiting, name)
		affected[name] = hit
		return hit, nil
	}
	for name := range g.Target {
		if _, err := visit(name); err != nil {
			return nil, err
		}
	}
	return affected, nil
}
func (g Graph) Select(base *Graph, changed []string, event string, requested []string, limit int) (Plan, error) {
	published, err := g.Published()
	if err != nil {
		return Plan{}, err
	}
	chosen := map[string]bool{}
	if event == "workflow_dispatch" {
		expanded, err := g.Expand(requested...)
		if err != nil {
			return Plan{}, err
		}
		for _, t := range expanded {
			if !slices.Contains(published, t) {
				return Plan{}, fmt.Errorf("target %s is not published", t)
			}
			chosen[t] = true
		}
	} else {
		chosen, err = g.Affected(base, changed)
		if err != nil {
			return Plan{}, err
		}
	}
	p := Plan{}
	for _, t := range published {
		if chosen[t] {
			p.Targets = append(p.Targets, t)
		}
	}
	p.Jobs, err = g.Jobs(p.Targets, limit)
	return p, err
}
func (g Graph) Jobs(targets []string, limit int) ([]Job, error) {
	if limit < 1 {
		return nil, errors.New("job limit must be positive")
	}
	byTool := map[string][]string{}
	for _, t := range targets {
		tool, err := g.Tool(t)
		if err != nil {
			return nil, err
		}
		byTool[tool] = append(byTool[tool], t)
	}
	upstream := map[string]map[string]bool{}
	for t := range g.Target {
		tool, err := g.Tool(t)
		if err != nil {
			return nil, err
		}
		if upstream[tool] == nil {
			upstream[tool] = map[string]bool{}
		}
		deps, err := g.Dependencies(t)
		if err != nil {
			return nil, err
		}
		for _, d := range deps {
			owner, err := g.Tool(d)
			if err != nil {
				return nil, err
			}
			if owner != tool {
				upstream[tool][owner] = true
			}
		}
	}
	depth := map[string]int{}
	active := map[string]bool{}
	var measure func(string) (int, error)
	measure = func(tool string) (int, error) {
		if active[tool] {
			return 0, fmt.Errorf("tool dependency cycle at %s", tool)
		}
		if d, ok := depth[tool]; ok {
			return d, nil
		}
		active[tool] = true
		max := 0
		for parent := range upstream[tool] {
			d, err := measure(parent)
			if err != nil {
				return 0, err
			}
			if d+1 > max {
				max = d + 1
			}
		}
		delete(active, tool)
		depth[tool] = max
		return max, nil
	}
	tools := make([]string, 0, len(upstream))
	for tool := range upstream {
		tools = append(tools, tool)
	}
	slices.Sort(tools)
	children := map[string][]string{}
	for _, tool := range tools {
		if _, err := measure(tool); err != nil {
			return nil, err
		}
		parent := ""
		for up := range upstream[tool] {
			if parent == "" || depth[up] > depth[parent] || (depth[up] == depth[parent] && up > parent) {
				parent = up
			}
		}
		children[parent] = append(children[parent], tool)
	}
	var order []string
	var walk func(string)
	walk = func(parent string) {
		for _, tool := range children[parent] {
			if len(byTool[tool]) > 0 {
				order = append(order, tool)
			}
			walk(tool)
		}
	}
	walk("")
	if len(order) == 0 {
		return []Job{}, nil
	}
	count := min(limit, len(order))
	remaining := len(targets)
	var groups [][]string
	share, load := 0.0, 0.0
	for i, tool := range order {
		size := len(byTool[tool])
		slots := count - len(groups)
		if len(groups) == 0 || (slots > 0 && (len(order)-i <= slots || load+float64(size) > share)) {
			groups = append(groups, []string{})
			share = float64(remaining) / float64(slots)
			load = 0
		}
		groups[len(groups)-1] = append(groups[len(groups)-1], tool)
		load += float64(size)
		remaining -= size
	}
	jobs := make([]Job, 0, len(groups))
	for i, group := range groups {
		j := Job{ID: fmt.Sprint(i + 1), Name: strings.Join(group, ", ")}
		for _, tool := range group {
			j.Targets = append(j.Targets, byTool[tool]...)
		}
		jobs = append(jobs, j)
	}
	return jobs, nil
}
func (g Graph) Contexts(name string) ([]string, error) {
	seen := map[string]bool{}
	contexts := map[string]bool{}
	var visit func(string) error
	visit = func(n string) error {
		if seen[n] {
			return nil
		}
		seen[n] = true
		t, ok := g.Target[n]
		if !ok {
			return fmt.Errorf("missing target %s", n)
		}
		contexts[t.Context] = true
		deps, err := g.Dependencies(n)
		if err != nil {
			return err
		}
		for _, d := range deps {
			if err := visit(d); err != nil {
				return err
			}
		}
		return nil
	}
	if err := visit(name); err != nil {
		return nil, err
	}
	var out []string
	for c := range contexts {
		out = append(out, c)
	}
	slices.Sort(out)
	return out, nil
}
