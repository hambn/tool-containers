package ops

import (
	"encoding/json"
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"
	"sync"
)

func runTo(file *os.File, env []string, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Env = append(os.Environ(), env...)
	cmd.Stdout = file
	cmd.Stderr = file
	return cmd.Run()
}
func bakeTo(file *os.File, env []string, args ...string) error {
	gitEnv, err := BuildEnv()
	if err != nil {
		return err
	}
	argv := append([]string{"buildx", "bake", "-f", BakeFile, "-f", VersionsFile}, args...)
	return runTo(file, append(gitEnv, env...), "docker", argv...)
}
func label(t graph.Target, key string) string { return t.Labels["io.github.hambn.containers."+key] }
func scanSkips(g graph.Graph, target string) ([]string, error) {
	contexts, err := g.Contexts(target)
	if err != nil {
		return nil, err
	}
	var args []string
	for _, dir := range contexts {
		data, err := os.ReadFile(filepath.Join(dir, "tests/trivy-skip-files.txt"))
		if os.IsNotExist(err) {
			continue
		}
		if err != nil {
			return nil, err
		}
		for _, line := range strings.Split(string(data), "\n") {
			p := strings.Fields(line)
			if len(p) > 0 && !strings.HasPrefix(p[0], "#") {
				args = append(args, "--skip-files", p[0])
			}
		}
	}
	return args, nil
}
func checkTarget(log *os.File, g graph.Graph, target, arch, result string, scan bool) error {
	t := g.Target[target]
	env := []string{"ARCH=" + arch, "PLATFORM=linux/" + arch}
	image := "local/" + target + ":" + arch
	args := []string{"--provenance=false", "--set", target + ".output=type=docker,rewrite-timestamp=true", "--set", target + ".tags=" + image, target}
	if err := bakeTo(log, env, args...); err != nil {
		return fmt.Errorf("load %s: %w", target, err)
	}
	configs := []string{"--config", filepath.Join(t.Context, "tests/structure.yaml")}
	seen := map[string]bool{}
	for _, name := range []string{label(t, "distro"), label(t, "tier"), label(t, "variant")} {
		if name == "" || seen[name] {
			continue
		}
		seen[name] = true
		p := filepath.Join(t.Context, "tests/structure-"+name+".yaml")
		if _, err := os.Stat(p); err == nil {
			configs = append(configs, "--config", p)
		}
	}
	cst := append([]string{"test", "--image", image, "--platform", "linux/" + arch}, configs...)
	if err := runTo(log, env, "container-structure-test", cst...); err != nil {
		return fmt.Errorf("structure %s: %w", target, err)
	}
	smoke := filepath.Join(t.Context, "tests/smoke.sh")
	if stat, err := os.Stat(smoke); err == nil && stat.Mode()&0111 != 0 {
		if err := runTo(log, env, smoke, image); err != nil {
			return fmt.Errorf("smoke %s: %w", target, err)
		}
	}
	if scan && arch == "amd64" {
		common := []string{"image", "--image-src", "docker", "--scanners", "vuln,secret", "--ignore-unfixed", "--ignorefile", "src/tools/trivyignore.yaml", "--timeout", "10m"}
		report := filepath.Join(result, "sarif", target+".sarif")
		if err := runTo(log, env, "trivy", append(append(slices.Clone(common), "--format", "sarif", "--output", report), image)...); err != nil {
			return fmt.Errorf("Trivy SARIF %s: %w", target, err)
		}
		data, err := os.ReadFile(report)
		if err != nil {
			return err
		}
		var sarif map[string]any
		if err := json.Unmarshal(data, &sarif); err != nil {
			return err
		}
		if runs, ok := sarif["runs"].([]any); ok {
			for _, r := range runs {
				if obj, ok := r.(map[string]any); ok {
					obj["automationDetails"] = map[string]any{"id": "trivy-" + target + "/"}
				}
			}
		}
		data, _ = json.Marshal(sarif)
		if err := os.WriteFile(report, data, 0644); err != nil {
			return err
		}
		skips, err := scanSkips(g, target)
		if err != nil {
			return err
		}
		gate := append(append(slices.Clone(common), "--severity", "HIGH,CRITICAL", "--exit-code", "1"), skips...)
		if err := runTo(log, env, "trivy", append(gate, image)...); err != nil {
			return fmt.Errorf("Trivy gate %s: %w", target, err)
		}
	}
	_ = runTo(log, env, "docker", "image", "rm", image)
	return nil
}
func verifyArch(log *os.File, g graph.Graph, targets []string, arch, result string, scan bool) error {
	env := []string{"ARCH=" + arch, "PLATFORM=linux/" + arch}
	args := []string{"--provenance=false"}
	for _, t := range targets {
		args = append(args, "--set", t+".output=type=cacheonly")
	}
	args = append(args, targets...)
	if err := bakeTo(log, env, args...); err != nil {
		return fmt.Errorf("build %s: %w", arch, err)
	}
	for _, t := range targets {
		if err := checkTarget(log, g, t, arch, result, scan); err != nil {
			return err
		}
	}
	return nil
}
func pushArch(log *os.File, g graph.Graph, targets []string, arch, result string) error {
	env := []string{"ARCH=" + arch, "PLATFORM=linux/" + arch, "CACHE_WRITE=true"}
	metadata := filepath.Join(result, "metadata-"+arch+".json")
	args := []string{"--provenance=mode=max", "--sbom=true", "--metadata-file", metadata}
	for _, target := range targets {
		t := g.Target[target]
		if len(t.Tags) == 0 {
			return fmt.Errorf("%s has no tags", target)
		}
		image := strings.Split(t.Tags[0], ":")[0]
		args = append(args, "--set", target+".tags=", "--set", target+".output=type=image,name="+image+",push-by-digest=true,name-canonical=true,push=true,rewrite-timestamp=true")
	}
	args = append(args, targets...)
	if err := bakeTo(log, env, args...); err != nil {
		return err
	}
	data, err := os.ReadFile(metadata)
	if err != nil {
		return err
	}
	var output map[string]map[string]any
	if err := json.Unmarshal(data, &output); err != nil {
		return err
	}
	for _, t := range targets {
		digest, _ := output[t]["containerimage.digest"].(string)
		if !validDigest(digest) {
			return fmt.Errorf("missing digest for %s on %s", t, arch)
		}
		if err := os.WriteFile(filepath.Join(result, "digests", t+"-"+arch), []byte(digest+"\n"), 0644); err != nil {
			return err
		}
	}
	return nil
}
func archStep(g graph.Graph, tool string, targets []string, arches []string, result, step string, scan bool) error {
	type outcome struct {
		arch string
		err  error
		path string
	}
	results := make(chan outcome, len(arches))
	var wg sync.WaitGroup
	for _, arch := range arches {
		wg.Add(1)
		go func(arch string) {
			defer wg.Done()
			file := filepath.Join(result, "logs", strings.ReplaceAll(tool, "/", "-")+"-"+step+"-"+arch+".log")
			log, err := os.Create(file)
			if err == nil {
				if step == "verify" {
					err = verifyArch(log, g, targets, arch, result, scan)
				} else {
					err = pushArch(log, g, targets, arch, result)
				}
				log.Close()
			}
			results <- outcome{arch, err, file}
		}(arch)
	}
	wg.Wait()
	close(results)
	failed := false
	for r := range results {
		if r.err != nil {
			failed = true
			fmt.Fprintf(os.Stderr, "::error::%s %s failed on %s: %v\n", tool, step, r.arch, r.err)
		} else {
			fmt.Printf("%s: %s passed on %s\n", tool, step, r.arch)
		}
		data, _ := os.ReadFile(r.path)
		fmt.Print(string(data))
	}
	if failed {
		return fmt.Errorf("%s %s failed", tool, step)
	}
	return nil
}

// Build isolates tools: a failed tool cannot prevent a later tool from being verified.
func Build(g graph.Graph, targets []string, arches []string, result string, scan, publish bool) error {
	for _, dir := range []string{"digests", "sarif", "logs"} {
		if err := os.MkdirAll(filepath.Join(result, dir), 0755); err != nil {
			return err
		}
	}
	byTool := map[string][]string{}
	var order []string
	for _, t := range targets {
		tool, err := g.Tool(t)
		if err != nil {
			return err
		}
		if _, ok := byTool[tool]; !ok {
			order = append(order, tool)
		}
		byTool[tool] = append(byTool[tool], t)
	}
	failed := false
	for i, tool := range order {
		variants := byTool[tool]
		err := archStep(g, tool, variants, arches, result, "verify", scan)
		if err == nil && publish {
			err = archStep(g, tool, variants, arches, result, "push", false)
		}
		if err != nil {
			failed = true
			fmt.Fprintf(os.Stderr, "::error::%s failed: %v\n", tool, err)
			for _, t := range variants {
				for _, arch := range arches {
					_ = os.Remove(filepath.Join(result, "digests", t+"-"+arch))
				}
			}
		}
		if i < len(order)-1 {
			_ = Stream(nil, "docker", "buildx", "prune", "--force", "--min-free-space", "10gb")
		}
	}
	if failed {
		return fmt.Errorf("one or more tools failed")
	}
	return nil
}
func validDigest(s string) bool {
	if len(s) != 71 || !strings.HasPrefix(s, "sha256:") {
		return false
	}
	for _, c := range s[7:] {
		if (c < '0' || c > '9') && (c < 'a' || c > 'f') {
			return false
		}
	}
	return true
}
