package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/check"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"github.com/hambn/tool-containers/src/ci/internal/ops"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func fatal(err error) {
	if err != nil {
		fmt.Fprintln(os.Stderr, err)
		os.Exit(1)
	}
}
func env(name, defaultValue string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return defaultValue
}
func decodeEnv(name string, out any) error { return json.Unmarshal([]byte(os.Getenv(name)), out) }
func plan() error {
	fs := flag.NewFlagSet("plan", flag.ExitOnError)
	event := fs.String("event", env("EVENT_NAME", "workflow_dispatch"), "GitHub event")
	base := fs.String("base", os.Getenv("BASE_SHA"), "base commit")
	head := fs.String("head", env("HEAD_SHA", "HEAD"), "head commit")
	targets := fs.String("targets", env("DISPATCH_TARGETS", "all"), "requested Bake targets")
	limit := fs.Int("max-jobs", 16, "maximum build jobs")
	fs.Parse(os.Args[2:])
	g, err := ops.Print(nil, "all")
	if err != nil {
		return err
	}
	var bg *graph.Graph
	var changed []string
	if *event != "workflow_dispatch" && *base != "" && *base != strings.Repeat("0", 40) {
		diff, err := ops.Git("diff", "--name-only", *base, *head)
		if err != nil {
			return err
		}
		changed = strings.Fields(diff)
		bg, err = ops.BaseGraph(*base)
		if err != nil {
			return err
		}
	}
	requested := strings.Fields(*targets)
	if len(requested) == 0 {
		requested = []string{"all"}
	}
	p, err := g.Select(bg, changed, *event, requested, *limit)
	if err != nil {
		return err
	}
	return ops.Output(map[string]string{"targets": ops.Pretty(p.Targets), "jobs": ops.Pretty(p.Jobs)})
}
func run() error {
	if len(os.Args) < 2 {
		return fmt.Errorf("usage: ci <bake|plan|build|publish|pr|validate|lint|install|catalog|rescan|os-refresh|cleanup|cleanup-catalog|hub-readme|qemu-check|reports|subjects> [arguments]")
	}
	switch os.Args[1] {
	case "bake":
		return ops.BakeStream(nil, os.Args[2:]...)
	case "plan":
		return plan()
	case "build":
		targets, err := ops.JSONTargets()
		if err != nil {
			return err
		}
		g, err := ops.Print(nil, targets...)
		if err != nil {
			return err
		}
		arches := strings.Fields(env("ARCHES", "amd64 arm64"))
		if len(arches) == 0 {
			return fmt.Errorf("ARCHES is empty")
		}
		for _, a := range arches {
			if a != "amd64" && a != "arm64" {
				return fmt.Errorf("unsupported architecture %s", a)
			}
		}
		return ops.Build(g, targets, arches, env("RESULT_DIR", "/tmp/image-results"), os.Getenv("SCAN") == "true", os.Getenv("PUBLISH") == "true")
	case "publish":
		if len(os.Args) != 4 {
			return fmt.Errorf("usage: ci publish <digest-dir> <subjects-file>")
		}
		targets, err := ops.JSONTargets()
		if err != nil {
			return err
		}
		return ops.Publish(targets, os.Args[2], os.Args[3])
	case "pr":
		return check.PR(os.Getenv("PR_TITLE"), os.Getenv("PR_BODY"), os.Getenv("ACTOR"))
	case "validate":
		return check.Run()
	case "catalog":
		g, err := ops.Print([]string{"TAG_SET=moving"}, "all")
		if err != nil {
			return err
		}
		repos, refs, err := ops.Catalog(g)
		if err != nil {
			return err
		}
		return ops.Output(map[string]string{"repos": ops.Pretty(repos), "refs": ops.Pretty(refs)})
	case "rescan":
		var refs []string
		if err := decodeEnv("REFS", &refs); err != nil {
			return err
		}
		vulnerable, err := ops.Rescan(refs)
		if err != nil {
			return err
		}
		return ops.Output(map[string]string{"vulnerable": fmt.Sprint(vulnerable)})
	case "os-refresh":
		return ops.Refresh("")
	case "cleanup":
		fs := flag.NewFlagSet("cleanup", flag.ExitOnError)
		dry := fs.Bool("dry-run", false, "list versions without deleting")
		age := fs.Int("min-age-days", 14, "retention window")
		fs.Parse(os.Args[2:])
		if *age < 0 || len(fs.Args()) == 0 {
			return fmt.Errorf("cleanup requires packages and nonnegative age")
		}
		return ops.Cleanup(fs.Args(), time.Duration(*age)*24*time.Hour, *dry)
	case "hub-readme":
		if len(os.Args) != 3 {
			return fmt.Errorf("usage: ci hub-readme <README>")
		}
		data, err := os.ReadFile(os.Args[2])
		if err != nil {
			return err
		}
		fmt.Print(ops.RewriteReadme(os.Args[2], string(data)))
		return nil
	case "qemu-check":
		data, err := os.ReadFile("/proc/sys/fs/binfmt_misc/qemu-aarch64")
		if err != nil {
			return err
		}
		for _, flag := range []string{"C", "F"} {
			if !strings.Contains(string(data), "flags: ") || !strings.Contains(strings.Split(strings.Split(string(data), "flags: ")[1], "\n")[0], flag) {
				return fmt.Errorf("arm64 binfmt missing %s flag", flag)
			}
		}
		return nil
	case "subjects":
		data, err := os.ReadFile(os.Args[2])
		if err == nil && len(data) > 0 {
			return ops.Output(map[string]string{"present": "true"})
		}
		if os.IsNotExist(err) {
			return nil
		}
		return err
	case "cleanup-catalog":
		var repos []ops.Repo
		if err := decodeEnv("REPOS", &repos); err != nil {
			return err
		}
		names := make([]string, 0, len(repos))
		for _, r := range repos {
			names = append(names, r.Repo)
		}
		return ops.Cleanup(names, 14*24*time.Hour, os.Getenv("DRY_RUN") == "true")
	case "install":
		if len(os.Args) != 3 {
			return fmt.Errorf("usage: ci install <cst|linters>")
		}
		return ops.Install(os.Args[2])
	case "lint":
		return ops.Lint()
	case "reports":
		matches, err := filepath.Glob(filepath.Join(env("RESULT_DIR", "/tmp/image-results"), "sarif", "*.sarif"))
		if err != nil {
			return err
		}
		if len(matches) > 0 {
			return ops.Output(map[string]string{"present": "true"})
		}
		return nil
	default:
		return fmt.Errorf("unknown subcommand %s", os.Args[1])
	}
}
func main() { fatal(run()) }
