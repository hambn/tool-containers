package check

import (
	"gopkg.in/yaml.v3"
	"io/fs"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

var skillNameRE = regexp.MustCompile(`^[a-z0-9]+(?:-[a-z0-9]+)*$`)
var frontmatterRE = regexp.MustCompile(`(?s)^---\s*\n(.*?)\n---\s*\n`)
var skillRouteRE = regexp.MustCompile(`\$([a-z0-9]+(?:-[a-z0-9]+)*)`)

func (v *Validator) workspace() {
	if _, err := os.Stat("AGENTS.md"); err != nil {
		v.add("missing AGENTS.md")
	}
	if _, err := os.Stat("CLAUDE.md"); err == nil {
		v.add("obsolete CLAUDE.md")
	}
	entries, _ := os.ReadDir(".agents")
	for _, entry := range entries {
		if entry.Name() != "skills" {
			v.add(".agents may contain only skills/: %s", entry.Name())
		}
	}
	skills, err := os.ReadDir(".agents/skills")
	if err != nil {
		v.add("missing .agents/skills: %v", err)
		return
	}
	seenName := map[string]bool{}
	seenDesc := map[string]bool{}
	for _, entry := range skills {
		if !entry.IsDir() {
			v.add("loose .agents/skills entry %s", entry.Name())
			continue
		}
		dir := filepath.Join(".agents/skills", entry.Name())
		entrypoint := filepath.Join(dir, "SKILL.md")
		text := read(entrypoint)
		match := frontmatterRE.FindStringSubmatch(text)
		if match == nil {
			v.add("%s: missing YAML frontmatter", entrypoint)
			continue
		}
		var meta map[string]any
		if err := yaml.Unmarshal([]byte(match[1]), &meta); err != nil {
			v.add("%s: invalid frontmatter: %v", entrypoint, err)
			continue
		}
		name := str(meta["name"])
		desc := str(meta["description"])
		if name != entry.Name() || !skillNameRE.MatchString(name) || len(name) > 64 {
			v.add("%s: invalid skill name", entrypoint)
		}
		if seenName[name] {
			v.add("%s: duplicate skill name", entrypoint)
		}
		seenName[name] = true
		if strings.TrimSpace(desc) == "" || len(desc) > 500 || seenDesc[strings.ToLower(desc)] {
			v.add("%s: invalid or duplicate description", entrypoint)
		}
		seenDesc[strings.ToLower(desc)] = true
		visited := map[string]bool{}
		queue := []string{entrypoint}
		for len(queue) > 0 {
			current := queue[0]
			queue = queue[1:]
			if visited[current] {
				continue
			}
			visited[current] = true
			if !strings.HasSuffix(current, ".md") {
				continue
			}
			for _, m := range linkRE.FindAllStringSubmatch(read(current), -1) {
				target := strings.Split(m[1], "#")[0]
				if target == "" || strings.Contains(target, ":") {
					continue
				}
				resolved := filepath.Clean(filepath.Join(filepath.Dir(current), target))
				if strings.HasPrefix(resolved, "../") || filepath.IsAbs(resolved) {
					v.add("%s: link escapes repository: %s", current, target)
					continue
				}
				info, err := os.Stat(resolved)
				if err != nil {
					v.add("%s: missing link %s", current, target)
					continue
				}
				if strings.HasPrefix(resolved, dir+string(filepath.Separator)) && info.Mode().IsRegular() {
					queue = append(queue, resolved)
				}
			}
		}
		for _, section := range []string{"references", "scripts"} {
			root := filepath.Join(dir, section)
			_ = filepath.WalkDir(root, func(file string, d fs.DirEntry, err error) error {
				if err != nil {
					return nil
				}
				if !d.IsDir() && !visited[file] {
					v.add("%s: unreachable skill resource", file)
				}
				if !d.IsDir() && strings.HasSuffix(file, ".sh") {
					if info, err := os.Stat(file); err == nil && info.Mode()&0111 == 0 {
						v.add("%s: skill script is not executable", file)
					}
				}
				if !d.IsDir() && filepath.Base(file) == "memory.md" {
					v.add("%s: legacy memory is not allowed", file)
				}
				return nil
			})
		}
	}
	_ = filepath.WalkDir(".", func(file string, d fs.DirEntry, err error) error {
		if err != nil {
			return nil
		}
		if d.IsDir() && (d.Name() == ".git" || d.Name() == ".tmp" || d.Name() == ".codex" || d.Name() == ".claude" || d.Name() == "node_modules" || d.Name() == "dist" || d.Name() == "build" || d.Name() == "coverage" || d.Name() == ".venv") {
			return filepath.SkipDir
		}
		if !d.IsDir() && (d.Name() == "AGENTS.md" || d.Name() == "CLAUDE.md") && file != "AGENTS.md" {
			v.add("%s: nested agent entrypoint is not allowed", file)
		}
		return nil
	})
	for _, route := range []string{"repository-changes", "maintain-agent-workspace", "repository-map", "container-images", "documentation", "web-ui"} {
		if !strings.Contains(read("AGENTS.md"), "$"+route) {
			v.add("AGENTS.md missing route $%s", route)
		}
	}
	for _, m := range skillRouteRE.FindAllStringSubmatch(read("AGENTS.md"), -1) {
		if !seenName[m[1]] {
			v.add("AGENTS.md routes missing skill %s", m[1])
		}
	}
}
