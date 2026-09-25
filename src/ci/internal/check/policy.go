package check

import (
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func (v *Validator) issueForms() {
	root := ".github/ISSUE_TEMPLATE"
	config, err := yamlFile(filepath.Join(root, "config.yml"))
	if err != nil {
		v.add("issue config: %v", err)
		return
	}
	if config["blank_issues_enabled"] != false {
		v.add("blank issues must be disabled")
	}
	for _, raw := range list(config["contact_links"]) {
		link := dict(raw)
		for _, key := range []string{"name", "url", "about"} {
			if str(link[key]) == "" {
				v.add("issue contact link missing %s", key)
			}
		}
		if !strings.HasPrefix(str(link["url"]), "https://") {
			v.add("issue contact link requires HTTPS")
		}
	}
	expected := map[string]string{"bug-report.yml": "bug", "feature-request.yml": "enhancement", "usage-question.yml": "question"}
	paths, _ := filepath.Glob(filepath.Join(root, "*.yml"))
	for _, file := range paths {
		if filepath.Base(file) == "config.yml" {
			continue
		}
		name := filepath.Base(file)
		label, ok := expected[name]
		if !ok {
			v.add("unexpected issue form %s", name)
			continue
		}
		delete(expected, name)
		doc, err := yamlFile(file)
		if err != nil {
			v.add("%s: %v", file, err)
			continue
		}
		if str(doc["name"]) == "" || str(doc["description"]) == "" || len(list(doc["body"])) == 0 {
			v.add("%s: missing name, description or body", file)
		}
		labels := list(doc["labels"])
		if len(labels) != 1 || str(labels[0]) != label {
			v.add("%s: unexpected labels", file)
		}
		seen := map[string]bool{}
		for i, raw := range list(doc["body"]) {
			item := dict(raw)
			kind := str(item["type"])
			attrs := dict(item["attributes"])
			if kind == "markdown" {
				if str(attrs["value"]) == "" {
					v.add("%s: markdown item %d lacks value", file, i)
				}
				continue
			}
			if kind != "checkboxes" && kind != "dropdown" && kind != "input" && kind != "textarea" {
				v.add("%s: unsupported item %d", file, i)
			}
			id := str(item["id"])
			if id == "" || seen[id] || !regexp.MustCompile(`^[A-Za-z0-9_-]+$`).MatchString(id) {
				v.add("%s: invalid or duplicate item id %q", file, id)
			}
			seen[id] = true
			if str(attrs["label"]) == "" {
				v.add("%s: item %s missing label", file, id)
			}
			for _, val := range dict(item["validations"]) {
				if _, ok := val.(bool); !ok {
					v.add("%s: invalid validation on %s", file, id)
				}
			}
			if (kind == "dropdown" || kind == "checkboxes") && len(list(attrs["options"])) == 0 {
				v.add("%s: %s lacks options", file, id)
			}
		}
	}
	for name := range expected {
		v.add("missing issue form %s", name)
	}
}
func (v *Validator) pipelineLayout() {
	for _, name := range []string{"images.yml", "maintenance.yml", "pr.yml", "web-ui.yml"} {
		if _, err := os.Stat(filepath.Join(".github/workflows", name)); err != nil {
			v.add("missing workflow %s", name)
		}
	}
	for _, file := range []string{".github/dependabot.yml", ".github/requirements.txt", ".github/scripts/check-repo.py", ".github/scripts/plan.py", ".github/scripts/build-tools.sh", ".github/scripts/publish.sh"} {
		if _, err := os.Stat(file); err == nil {
			v.add("obsolete CI file %s", file)
		}
	}
	if _, err := os.Stat(".github/renovate.json5"); err != nil {
		v.add("missing Renovate configuration")
	}
	ignore, err := yamlFile("src/tools/trivyignore.yaml")
	if err != nil {
		v.add("Trivy exceptions: %v", err)
		return
	}
	for kind, raw := range ignore {
		for _, entry := range list(raw) {
			item := dict(entry)
			if str(item["statement"]) == "" {
				v.add("Trivy %s exception %v missing statement", kind, item["id"])
			}
		}
	}
}
func (v *Validator) exampleLinks(files []string) {
	for _, file := range files {
		if !strings.HasPrefix(file, "src/tools/") || !strings.Contains(file, "/examples/") || !strings.HasSuffix(file, "/README.md") {
			continue
		}
		dir := filepath.Dir(file)
		text := read(file)
		for _, other := range files {
			if other == file || !strings.HasPrefix(other, dir+string(filepath.Separator)) {
				continue
			}
			relative, _ := filepath.Rel(dir, other)
			if !strings.Contains(text, relative) {
				v.add("%s: does not link %s", file, relative)
			}
		}
	}
}
