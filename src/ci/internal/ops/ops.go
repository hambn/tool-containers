package ops

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const BakeFile = "src/tools/docker-bake.hcl"
const VersionsFile = "src/tools/versions.hcl"

func Run(env []string, name string, args ...string) ([]byte, error) {
	c := exec.Command(name, args...)
	c.Env = append(os.Environ(), env...)
	var stdout, stderr bytes.Buffer
	c.Stdout, c.Stderr = &stdout, &stderr
	err := c.Run()
	if err != nil {
		out := append(stdout.Bytes(), stderr.Bytes()...)
		return out, fmt.Errorf("%s %s: %w\n%s", name, strings.Join(args, " "), err, out)
	}
	return stdout.Bytes(), nil
}
func Stream(env []string, name string, args ...string) error {
	c := exec.Command(name, args...)
	c.Env = append(os.Environ(), env...)
	c.Stdout = os.Stdout
	c.Stderr = os.Stderr
	c.Stdin = os.Stdin
	return c.Run()
}
func Git(args ...string) (string, error) {
	out, err := Run(nil, "git", args...)
	return strings.TrimSpace(string(out)), err
}
func BuildEnv() ([]string, error) {
	sha, err := Git("rev-parse", "HEAD")
	if err != nil {
		return nil, err
	}
	stamp, err := Git("log", "-1", "--format=%ct")
	if err != nil {
		return nil, err
	}
	seconds, err := time.ParseDuration(stamp + "s")
	if err != nil {
		return nil, err
	}
	t := time.Unix(int64(seconds.Seconds()), 0).UTC()
	return []string{"GIT_SHA=" + sha, "BUILD_DATE=" + t.Format("20060102"), "CREATED=" + t.Format(time.RFC3339), "SOURCE_DATE_EPOCH=" + stamp}, nil
}
func BakeFiles(files []string, env []string, args ...string) ([]byte, error) {
	argv := []string{"buildx", "bake"}
	for _, file := range files {
		argv = append(argv, "-f", file)
	}
	argv = append(argv, args...)
	c := exec.Command("docker", argv...)
	c.Env = append(os.Environ(), env...)
	out, err := c.Output()
	if err != nil {
		return nil, fmt.Errorf("docker buildx bake: %w", err)
	}
	return out, nil
}
func Bake(env []string, args ...string) ([]byte, error) {
	gitEnv, err := BuildEnv()
	if err != nil {
		return nil, err
	}
	return BakeFiles([]string{BakeFile, VersionsFile}, append(gitEnv, env...), args...)
}
func BakeStream(env []string, args ...string) error {
	gitEnv, err := BuildEnv()
	if err != nil {
		return err
	}
	argv := []string{"buildx", "bake", "-f", BakeFile, "-f", VersionsFile}
	argv = append(argv, args...)
	return Stream(append(gitEnv, env...), "docker", argv...)
}
func Print(env []string, names ...string) (graph.Graph, error) {
	args := append([]string{"--print"}, names...)
	out, err := Bake(env, args...)
	if err != nil {
		return graph.Graph{}, err
	}
	return graph.Parse(out)
}
func BaseGraph(base string) (*graph.Graph, error) {
	dir, err := os.MkdirTemp("", "ci-bake-base-")
	if err != nil {
		return nil, err
	}
	defer os.RemoveAll(dir)
	var files []string
	for _, source := range []string{BakeFile, VersionsFile} {
		out, err := Run(nil, "git", "show", base+":"+source)
		if err != nil {
			return nil, nil
		}
		dest := filepath.Join(dir, filepath.Base(source))
		if err := os.WriteFile(dest, out, 0600); err != nil {
			return nil, err
		}
		files = append(files, dest)
	}
	env, err := BuildEnv()
	if err != nil {
		return nil, err
	}
	out, err := BakeFiles(files, env, "--print", "all")
	if err != nil {
		return nil, nil
	}
	g, err := graph.Parse(out)
	return &g, err
}
func JSONTargets() ([]string, error) {
	var targets []string
	if err := json.Unmarshal([]byte(os.Getenv("TARGETS")), &targets); err != nil {
		return nil, fmt.Errorf("TARGETS must be JSON target array: %w", err)
	}
	if len(targets) == 0 {
		return nil, fmt.Errorf("TARGETS is empty")
	}
	for _, t := range targets {
		if t == "" || strings.ContainsAny(t, " /\\\t\n") {
			return nil, fmt.Errorf("invalid target %q", t)
		}
	}
	return targets, nil
}
func Output(values map[string]string) error {
	if file := os.Getenv("GITHUB_OUTPUT"); file != "" {
		f, err := os.OpenFile(file, os.O_APPEND|os.O_WRONLY, 0600)
		if err != nil {
			return err
		}
		defer f.Close()
		for k, v := range values {
			if _, err := fmt.Fprintf(f, "%s=%s\n", k, v); err != nil {
				return err
			}
		}
		return nil
	}
	b, _ := json.MarshalIndent(values, "", "  ")
	fmt.Println(string(b))
	return nil
}
func Pretty(v any) string { b, _ := json.Marshal(v); return string(b) }
func Status(err error) int {
	if err == nil {
		return 0
	}
	var exit *exec.ExitError
	if errors.As(err, &exit) {
		return exit.ExitCode()
	}
	return 1
}
