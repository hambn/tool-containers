package ops

import (
	"encoding/json"
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"os"
	"path"
	"path/filepath"
	"regexp"
	"slices"
	"strings"
	"time"
)

type Repo struct {
	Repo        string `json:"repo"`
	Readme      string `json:"readme"`
	Description string `json:"description"`
}

func Catalog(g graph.Graph) ([]Repo, []string, error) {
	published, err := g.Published()
	if err != nil {
		return nil, nil, err
	}
	repos := map[string]Repo{}
	var refs []string
	for _, name := range published {
		t := g.Target[name]
		for _, tag := range t.Tags {
			if !strings.HasPrefix(tag, "ghcr.io/") {
				continue
			}
			if strings.HasSuffix(tag, ":latest") {
				parts := strings.Split(tag, "/")
				repo := strings.Split(parts[len(parts)-1], ":")[0]
				description := t.Labels["org.opencontainers.image.description"]
				runes := []rune(description)
				if len(runes) > 100 {
					description = string(runes[:100])
				}
				repos[repo] = Repo{repo, filepath.ToSlash(filepath.Join(t.Context, "README.md")), description}
			} else {
				refs = append(refs, tag)
			}
		}
	}
	var ordered []Repo
	for _, r := range repos {
		ordered = append(ordered, r)
	}
	slices.SortFunc(ordered, func(a, b Repo) int { return strings.Compare(a.Repo, b.Repo) })
	slices.Sort(refs)
	return ordered, refs, nil
}
func Rescan(refs []string) (bool, error) {
	vulnerable := false
	for _, ref := range refs {
		fmt.Println("::group::" + ref)
		out, err := Run(nil, "trivy", "image", "--quiet", "--image-src", "remote", "--platform", "linux/amd64", "--pkg-types", "os", "--scanners", "vuln", "--severity", "HIGH,CRITICAL", "--ignore-unfixed", "--ignorefile", "src/tools/trivyignore.yaml", "--exit-code", "2", ref)
		fmt.Print(string(out))
		fmt.Println("::endgroup::")
		if err != nil {
			if Status(err) == 2 {
				vulnerable = true
				fmt.Fprintf(os.Stderr, "::warning::%s has fixable HIGH/CRITICAL OS vulnerabilities\n", ref)
			} else {
				return false, err
			}
		}
	}
	return vulnerable, nil
}
func UpdateOSRefresh(source, date string) (string, error) {
	re := regexp.MustCompile(`(?s)(variable "OS_REFRESH" \{[^}]*default = ")[^"]*(")`)
	if !re.MatchString(source) {
		return "", fmt.Errorf("OS_REFRESH variable not found")
	}
	return re.ReplaceAllString(source, "${1}"+date+"${2}"), nil
}

func Refresh(date string) error {
	if date == "" {
		date = time.Now().UTC().Format("2006-01-02")
	}
	if _, err := time.Parse("2006-01-02", date); err != nil {
		return err
	}
	source := VersionsFile
	original, err := os.ReadFile(source)
	if err != nil {
		return err
	}
	updated, err := UpdateOSRefresh(string(original), date)
	if err != nil {
		return err
	}
	if updated == string(original) {
		fmt.Println("OS_REFRESH already " + date)
		return nil
	}
	if err := os.WriteFile(source, []byte(updated), 0644); err != nil {
		return err
	}
	branch := "maintenance/os-refresh"
	title := "fix(images): refresh OS packages (" + date + ")"
	for _, args := range [][]string{{"switch", "-C", branch}, {"add", "--", source}, {"-c", "user.name=github-actions[bot]", "-c", "user.email=41898282+github-actions[bot]@users.noreply.github.com", "commit", "-m", title}} {
		if _, err := Run(nil, "git", args...); err != nil {
			return err
		}
	}
	repository := os.Getenv("GITHUB_REPOSITORY")
	if repository == "" {
		return fmt.Errorf("GITHUB_REPOSITORY is required")
	}
	if _, err := Run(nil, "git", "-c", "credential.helper=!gh auth git-credential", "push", "--force", "https://github.com/"+repository+".git", "HEAD:refs/heads/"+branch); err != nil {
		return err
	}
	body := "## Summary\n\n- The weekly scan found fixable HIGH/CRITICAL OS vulnerabilities. OS_REFRESH is now " + date + ".\n\n## Validation\n\n- The images workflow rebuilds, tests and scans every image.\n"
	number, err := Run(nil, "gh", "pr", "list", "--head", branch, "--state", "open", "--json", "number", "--jq", ".[0].number")
	if err != nil {
		return err
	}
	if candidate := strings.TrimSpace(string(number)); candidate != "" && candidate != "null" {
		_, err = Run(nil, "gh", "pr", "edit", candidate, "--title", title, "--body", body)
	} else {
		_, err = Run(nil, "gh", "pr", "create", "--base", "main", "--head", branch, "--title", title, "--body", body)
	}
	return err
}

type version struct {
	ID        int       `json:"id"`
	Name      string    `json:"name"`
	UpdatedAt time.Time `json:"updated_at"`
	Metadata  struct {
		Container struct {
			Tags []string `json:"tags"`
		} `json:"container"`
	} `json:"metadata"`
}
type manifest struct {
	Subject   json.RawMessage `json:"subject"`
	Manifests []struct {
		Digest string `json:"digest"`
	} `json:"manifests"`
}

func packageVersions(pkg string) ([]version, error) {
	out, err := Run(nil, "gh", "api", "--paginate", "--jq", ".[]", "/users/hambn/packages/container/"+pkg+"/versions")
	if err != nil {
		return nil, err
	}
	var result []version
	decoder := json.NewDecoder(strings.NewReader(string(out)))
	for decoder.More() {
		var v version
		if err := decoder.Decode(&v); err != nil {
			return nil, err
		}
		result = append(result, v)
	}
	return result, nil
}
func packageManifest(pkg, digest string) (manifest, error) {
	out, err := Run(nil, "docker", "buildx", "imagetools", "inspect", "--raw", "ghcr.io/hambn/"+pkg+"@"+digest)
	if err != nil {
		return manifest{}, err
	}
	var m manifest
	err = json.Unmarshal(out, &m)
	return m, err
}
func Cleanup(packages []string, age time.Duration, dry bool) error {
	for _, pkg := range packages {
		if !regexp.MustCompile(`^[a-z0-9][a-z0-9._-]*$`).MatchString(pkg) {
			return fmt.Errorf("invalid package %q", pkg)
		}
		versions, err := packageVersions(pkg)
		if err != nil {
			return err
		}
		keep := map[string]bool{}
		var pending []string
		for _, v := range versions {
			if len(v.Metadata.Container.Tags) > 0 {
				pending = append(pending, v.Name)
			}
		}
		for len(pending) > 0 {
			digest := pending[len(pending)-1]
			pending = pending[:len(pending)-1]
			if keep[digest] {
				continue
			}
			keep[digest] = true
			m, err := packageManifest(pkg, digest)
			if err != nil {
				return err
			}
			for _, child := range m.Manifests {
				pending = append(pending, child.Digest)
			}
		}
		cutoff := time.Now().UTC().Add(-age)
		for _, v := range versions {
			if keep[v.Name] || v.UpdatedAt.After(cutoff) {
				continue
			}
			m, err := packageManifest(pkg, v.Name)
			if err != nil {
				return err
			}
			if len(m.Subject) > 0 && string(m.Subject) != "null" {
				continue
			}
			verb := "deleting"
			if dry {
				verb = "would delete"
			}
			fmt.Printf("%s %s@%s (%s)\n", verb, pkg, v.Name, v.UpdatedAt.Format(time.RFC3339))
			if !dry {
				if _, err := Run(nil, "gh", "api", "--method", "DELETE", fmt.Sprintf("/users/hambn/packages/container/%s/versions/%d", pkg, v.ID)); err != nil {
					return err
				}
			}
		}
	}
	return nil
}

var mdLink = regexp.MustCompile(`(!?\[[^\]]*\])\(([^)\s]+)\)`)

func RewriteReadme(readme, text string) string {
	return mdLink.ReplaceAllStringFunc(text, func(match string) string {
		pieces := mdLink.FindStringSubmatch(match)
		target := pieces[2]
		if strings.HasPrefix(target, "#") || strings.Contains(target, ":") {
			return match
		}
		parts := strings.SplitN(target, "#", 2)
		resolved := path.Clean(path.Join(filepath.ToSlash(filepath.Dir(readme)), parts[0]))
		if strings.HasPrefix(pieces[1], "!") {
			return pieces[1] + "(https://raw.githubusercontent.com/hambn/tool-containers/main/" + resolved + ")"
		}
		kind := "blob"
		if info, err := os.Stat(resolved); err == nil && info.IsDir() {
			kind = "tree"
		}
		url := "https://github.com/hambn/tool-containers/" + kind + "/main/" + resolved
		if len(parts) > 1 {
			url += "#" + parts[1]
		}
		return pieces[1] + "(" + url + ")"
	})
}
