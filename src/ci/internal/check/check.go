package check

import (
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"github.com/hambn/tool-containers/src/ci/internal/ops"
	"gopkg.in/yaml.v3"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
)

var linkRE = regexp.MustCompile(`\[[^]]*\]\(([^)\s]+)\)`)
var actionRE = regexp.MustCompile(`(?m)^\s*(?:-\s+)?uses:\s*([^#\s]+)(.*)$`)
var digestRE = regexp.MustCompile(`^[^@]+@[a-f0-9]{40}$`)
var variableRE = regexp.MustCompile(`^variable "([A-Za-z0-9_]+)"`)

type Validator struct{ Errors []string }

func (v *Validator) add(format string, args ...any) {
	v.Errors = append(v.Errors, fmt.Sprintf(format, args...))
}
func read(path string) string { b, _ := os.ReadFile(path); return string(b) }
func yamlFile(path string) (map[string]any, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var result map[string]any
	err = yaml.Unmarshal(b, &result)
	return result, err
}
func dict(value any) map[string]any {
	if m, ok := value.(map[string]any); ok {
		return m
	}
	return map[string]any{}
}
func list(value any) []any {
	if a, ok := value.([]any); ok {
		return a
	}
	return nil
}
func str(value any) string                     { s, _ := value.(string); return s }
func hasKey(m map[string]any, key string) bool { _, ok := m[key]; return ok }
func (v *Validator) workflows() {
	paths, _ := filepath.Glob(".github/workflows/*.yml")
	for _, path := range paths {
		doc, err := yamlFile(path)
		if err != nil {
			v.add("%s: %v", path, err)
			continue
		}
		if perms, ok := doc["permissions"].(map[string]any); !ok || len(perms) != 0 {
			v.add("%s: workflow must set permissions: {}", path)
		}
		if !hasKey(doc, "concurrency") {
			v.add("%s: missing concurrency", path)
		}
		for jobName, raw := range dict(doc["jobs"]) {
			job := dict(raw)
			if str(job["name"]) == "" {
				v.add("%s: %s missing name", path, jobName)
			}
			if !hasKey(job, "permissions") {
				v.add("%s: %s missing permissions", path, jobName)
			}
			if !hasKey(job, "timeout-minutes") {
				v.add("%s: %s missing timeout", path, jobName)
			}
			if strings.Contains(str(job["runs-on"]), "latest") {
				v.add("%s: %s uses unpinned runner", path, jobName)
			}
			for _, step := range list(job["steps"]) {
				s := dict(step)
				if strings.HasPrefix(str(s["uses"]), "actions/checkout@") && dict(s["with"])["persist-credentials"] != false {
					v.add("%s: %s checkout persists credentials", path, jobName)
				}
				if script := str(s["run"]); script != "" {
					cmd := exec.Command("bash", "-n")
					cmd.Stdin = strings.NewReader(regexp.MustCompile(`\$\{\{.*?\}\}`).ReplaceAllString(script, "EXPR"))
					if out, err := cmd.CombinedOutput(); err != nil {
						v.add("%s: %s shell syntax: %s", path, jobName, out)
					}
				}
			}
		}
		for _, m := range actionRE.FindAllStringSubmatch(read(path), -1) {
			if strings.HasPrefix(m[1], "./") {
				continue
			}
			if !digestRE.MatchString(m[1]) || !strings.Contains(m[2], "# v") {
				v.add("%s: unpinned action %s", path, m[1])
			}
		}
	}
	gate, err := yamlFile(".github/workflows/pr.yml")
	if err != nil {
		v.add("pr gate: %v", err)
		return
	}
	events := dict(gate["on"])
	if len(events) != 3 || !hasKey(events, "pull_request") || !hasKey(events, "merge_group") || !hasKey(events, "workflow_dispatch") {
		v.add("PR gate must include pull_request, merge_group and workflow_dispatch")
	}
	pr := dict(events["pull_request"])
	types := map[string]bool{}
	for _, raw := range list(pr["types"]) {
		types[str(raw)] = true
	}
	for _, required := range []string{"opened", "edited", "synchronize", "reopened"} {
		if !types[required] {
			v.add("PR gate missing pull_request type %s", required)
		}
	}
	if len(types) != 4 {
		v.add("PR gate has unexpected pull_request types")
	}
	for _, key := range []string{"paths", "branches", "paths-ignore", "branches-ignore"} {
		if hasKey(pr, key) {
			v.add("PR gate cannot filter %s", key)
		}
	}
	job := dict(dict(gate["jobs"])["gate"])
	if str(job["name"]) != "Pull request gate" {
		v.add("PR gate job name changed")
	}
	perms := dict(job["permissions"])
	if len(perms) != 1 || str(perms["contents"]) != "read" {
		v.add("PR gate permissions changed")
	}
	for _, needle := range []string{"ci\" pr", "dependency-review-action@", "ci\" validate"} {
		if !strings.Contains(read(".github/workflows/pr.yml"), needle) {
			v.add("PR gate missing %s", needle)
		}
	}
	labelerDoc, err := yamlFile(".github/workflows/pr-labeler.yml")
	if err == nil {
		labelJob := dict(dict(labelerDoc["jobs"])["label"])
		p := dict(labelJob["permissions"])
		if len(p) != 2 || str(p["contents"]) != "read" || str(p["pull-requests"]) != "write" {
			v.add("labeler permissions changed")
		}
	}
	labeler := read(".github/workflows/pr-labeler.yml")
	if strings.Contains(labeler, "actions/checkout@") || !strings.Contains(labeler, "pull_request_target") || !strings.Contains(labeler, "sync-labels: true") {
		v.add("privileged labeler contract changed")
	}
	if !strings.Contains(read(".github/labeler.yml"), "**/*.md") {
		v.add("documentation label rule missing")
	}
	webDoc, err := yamlFile(".github/workflows/web-ui.yml")
	if err == nil {
		paths := list(dict(dict(webDoc["on"])["pull_request"])["paths"])
		found := false
		for _, raw := range paths {
			if str(raw) == "src/web-ui/**" {
				found = true
			}
		}
		if !found {
			v.add("web UI pull_request path filter missing")
		}
	}
}
func (v *Validator) tools(g graph.Graph, files []string) {
	contexts := map[string]bool{}
	for name, t := range g.Target {
		if t.Context != "" {
			if _, err := g.Tool(name); err != nil {
				v.add("%v", err)
			}
			contexts[t.Context] = true
		}
	}
	dirs, _ := filepath.Glob("src/tools/*/*")
	catalog := map[string]bool{}
	for _, match := range linkRE.FindAllStringSubmatch(read("README.md"), -1) {
		target := strings.TrimSuffix(strings.TrimPrefix(match[1], "./"), "/")
		if len(strings.Split(target, "/")) == 4 && strings.HasPrefix(target, "src/tools/") {
			if catalog[target] {
				v.add("duplicate catalog link %s", target)
			}
			catalog[target] = true
		}
	}
	for _, dir := range dirs {
		stat, err := os.Stat(dir)
		if err != nil || !stat.IsDir() {
			continue
		}
		if !contexts[dir] {
			v.add("%s has no Bake target", dir)
		}
		if !catalog[dir] {
			v.add("%s absent from catalog", dir)
		}
		for _, required := range []string{"README.md", "Dockerfile", "tests/structure.yaml"} {
			if _, err := os.Stat(filepath.Join(dir, required)); err != nil {
				v.add("%s missing %s", dir, required)
			}
		}
		examples, _ := filepath.Glob(filepath.Join(dir, "examples", "*"))
		if len(examples) == 0 {
			v.add("%s has no examples", dir)
		}
		for _, ex := range examples {
			if _, err := os.Stat(filepath.Join(ex, "README.md")); err != nil {
				v.add("%s has no README", ex)
			}
		}
	}
	for c := range contexts {
		if _, err := os.Stat(c); err != nil {
			v.add("Bake context %s missing", c)
		}
	}
	for c := range catalog {
		if _, err := os.Stat(c); err != nil {
			v.add("catalog tool %s missing", c)
		}
	}
	for _, file := range files {
		if strings.HasSuffix(file, "/Dockerfile") && strings.HasPrefix(file, "src/tools/") {
			text := read(file)
			if !strings.HasPrefix(text, "# syntax=docker/dockerfile:1") {
				v.add("%s: missing Dockerfile syntax", file)
			}
			if strings.Contains(text, "@sha256:") {
				v.add("%s: base digest belongs in versions.hcl", file)
			}
			if regexp.MustCompile(`apk\s+upgrade|apt-get\s+(dist-)?upgrade|apt\s+(full-|dist-)?upgrade`).MatchString(text) {
				v.add("%s: use OS_REFRESH instead of upgrading packages", file)
			}
		}
	}
}
func (v *Validator) versions() {
	lines := strings.Split(read("src/tools/versions.hcl"), "\n")
	for i, line := range lines {
		m := variableRE.FindStringSubmatch(line)
		if m != nil && m[1] != "OS_REFRESH" && (i == 0 || !strings.HasPrefix(lines[i-1], "# renovate: ")) {
			v.add("src/tools/versions.hcl: %s missing Renovate comment", m[1])
		}
	}
}
func (v *Validator) files(files []string) {
	for _, file := range files {
		if strings.HasSuffix(file, ".md") && !strings.Contains(file, "node_modules/") {
			for _, m := range linkRE.FindAllStringSubmatch(read(file), -1) {
				target := strings.Split(m[1], "#")[0]
				if target == "" || strings.Contains(target, ":") || strings.HasPrefix(target, "/") {
					continue
				}
				resolved := filepath.Join(filepath.Dir(file), target)
				if _, err := os.Stat(resolved); err != nil {
					v.add("%s: missing link %s", file, target)
				}
			}
		}
		if strings.HasSuffix(file, ".sh") {
			cmd := exec.Command("bash", "-n", file)
			if out, err := cmd.CombinedOutput(); err != nil {
				v.add("%s: %s", file, out)
			}
			if strings.HasPrefix(file, "src/tools/") || strings.HasPrefix(file, ".agents/") {
				stat, _ := os.Stat(file)
				if stat != nil && stat.Mode()&0111 == 0 {
					v.add("%s is not executable", file)
				}
			}
		}
	}
}
func (v *Validator) renders(files []string) {
	if _, err := exec.LookPath("docker"); err == nil {
		for _, file := range files {
			if strings.Contains(filepath.Base(file), "compose") && (strings.HasSuffix(file, ".yaml") || strings.HasSuffix(file, ".yml")) {
				_, err := ops.Run([]string{"WORKSPACE=.", "OPENAI_API_KEY=validation", "ANTHROPIC_API_KEY=validation"}, "docker", "compose", "-f", file, "config", "--quiet")
				if err != nil {
					v.add("%s: compose render: %v", file, err)
				}
			}
		}
	}
	if _, err := exec.LookPath("helm"); err == nil {
		for _, file := range files {
			if filepath.Base(file) == "Chart.yaml" {
				dir := filepath.Dir(file)
				for _, args := range [][]string{{"lint", dir}, {"template", "validation", dir}} {
					if _, err := ops.Run(nil, "helm", args...); err != nil {
						v.add("%s: helm render: %v", dir, err)
					}
				}
			}
		}
	}
}
func Run() error {
	v := &Validator{}
	v.workflows()
	v.issueForms()
	v.pipelineLayout()
	v.versions()
	v.workspace()
	if _, err := ops.Git("diff", "--check"); err != nil {
		v.add("unstaged whitespace: %v", err)
	}
	if _, err := ops.Git("diff", "--cached", "--check"); err != nil {
		v.add("staged whitespace: %v", err)
	}
	out, err := ops.Git("ls-files", "-z", "--cached", "--others", "--exclude-standard")
	if err != nil {
		return err
	}
	files := strings.Split(out, "\x00")
	var real []string
	for _, file := range files {
		if file != "" {
			if stat, err := os.Stat(file); err == nil && !stat.IsDir() {
				real = append(real, file)
			}
		}
	}
	slices.Sort(real)
	g, err := ops.Print(nil, "all")
	if err != nil {
		v.add("Bake graph: %v", err)
	} else {
		v.tools(g, real)
	}
	v.files(real)
	v.exampleLinks(real)
	v.renders(real)
	if len(v.Errors) > 0 {
		return fmt.Errorf("static validation failed:\n- %s", strings.Join(v.Errors, "\n- "))
	}
	fmt.Println("Static repository checks passed.")
	return nil
}
