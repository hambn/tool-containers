package check

import (
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestWorkspaceContracts(t *testing.T) {
	old, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}
	root := t.TempDir()
	if err := os.Chdir(root); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(old)
	routes := []string{"repository-changes", "maintain-agent-workspace", "repository-map", "container-images", "documentation", "web-ui"}
	var agents strings.Builder
	for _, route := range routes {
		agents.WriteString("Use $" + route + ".\n")
		dir := filepath.Join(".agents", "skills", route)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
		text := "---\nname: " + route + "\ndescription: Work on " + route + " in this repository.\n---\n\n# " + route + "\n"
		if err := os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(text), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile("AGENTS.md", []byte(agents.String()), 0644); err != nil {
		t.Fatal(err)
	}
	check := func(want bool) {
		t.Helper()
		v := &Validator{}
		v.workspace()
		if (len(v.Errors) > 0) != want {
			t.Fatalf("errors=%v want failure=%v", v.Errors, want)
		}
	}
	check(false)
	skill := ".agents/skills/web-ui/SKILL.md"
	if err := os.WriteFile(skill, []byte("---\nname: wrong\ndescription: bad\n---\n"), 0644); err != nil {
		t.Fatal(err)
	}
	check(true)
	if err := os.WriteFile(skill, []byte("---\nname: web-ui\ndescription: Work on web-ui in this repository.\n---\n\n[missing](references/missing.md)\n"), 0644); err != nil {
		t.Fatal(err)
	}
	check(true)
	if err := os.WriteFile(skill, []byte("---\nname: web-ui\ndescription: Work on web-ui in this repository.\n---\n\n# web-ui\n"), 0644); err != nil {
		t.Fatal(err)
	}
	if err := os.MkdirAll("nested", 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile("nested/AGENTS.md", []byte("bad"), 0644); err != nil {
		t.Fatal(err)
	}
	check(true)
}
func TestWorkspaceRegressionCases(t *testing.T) {
	old, _ := os.Getwd()
	root := t.TempDir()
	if err := os.Chdir(root); err != nil {
		t.Fatal(err)
	}
	defer os.Chdir(old)
	routes := []string{"repository-changes", "maintain-agent-workspace", "repository-map", "container-images", "documentation", "web-ui"}
	var agents strings.Builder
	for _, route := range routes {
		agents.WriteString("Use $" + route + ".\n")
		dir := filepath.Join(".agents", "skills", route)
		if err := os.MkdirAll(dir, 0755); err != nil {
			t.Fatal(err)
		}
		body := "---\nname: " + route + "\ndescription: Work on " + route + " in this repository.\n---\n\n# " + route + "\n"
		if err := os.WriteFile(filepath.Join(dir, "SKILL.md"), []byte(body), 0644); err != nil {
			t.Fatal(err)
		}
	}
	if err := os.WriteFile("AGENTS.md", []byte(agents.String()), 0644); err != nil {
		t.Fatal(err)
	}
	check := func(fragment string) {
		t.Helper()
		v := &Validator{}
		v.workspace()
		for _, e := range v.Errors {
			if strings.Contains(e, fragment) {
				return
			}
		}
		t.Fatalf("missing %q in %v", fragment, v.Errors)
	}
	script := ".agents/skills/web-ui/scripts/check.sh"
	if err := os.MkdirAll(filepath.Dir(script), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(script, []byte("#!/bin/sh\n"), 0644); err != nil {
		t.Fatal(err)
	}
	skill := ".agents/skills/web-ui/SKILL.md"
	f, err := os.OpenFile(skill, os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		t.Fatal(err)
	}
	if _, err := f.WriteString("\n[checker](scripts/check.sh)\n"); err != nil {
		t.Fatal(err)
	}
	f.Close()
	check("not executable")
	if err := os.Chmod(script, 0755); err != nil {
		t.Fatal(err)
	}
	memory := ".agents/skills/web-ui/references/memory.md"
	if err := os.MkdirAll(filepath.Dir(memory), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(memory, []byte("bad"), 0644); err != nil {
		t.Fatal(err)
	}
	check("legacy memory")
	if err := os.Remove(memory); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile("AGENTS.md", []byte(agents.String()+"Use $removed-skill.\n"), 0644); err != nil {
		t.Fatal(err)
	}
	check("routes missing skill")
	if err := os.WriteFile("AGENTS.md", []byte(strings.ReplaceAll(agents.String(), "$web-ui", "web-ui")), 0644); err != nil {
		t.Fatal(err)
	}
	check("missing route $web-ui")
	if err := os.WriteFile("CLAUDE.md", []byte("bad"), 0644); err != nil {
		t.Fatal(err)
	}
	check("obsolete CLAUDE.md")
}
