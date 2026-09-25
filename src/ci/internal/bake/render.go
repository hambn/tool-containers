package bake

import (
	"bytes"
	"context"
	"fmt"
	"maps"
	"slices"

	"github.com/hambn/tool-containers/src/ci/internal/run"
)

// Files are the Bake files, relative to the repository root, in load order.
var Files = []string{ToolsDir + "/docker-bake.hcl", ToolsDir + "/versions.hcl"}

// Renderer renders the Bake graph by running `docker buildx bake --print`, exactly as
// a developer would from the repository root.
type Renderer struct {
	Runner run.Runner
	Root   string   // Repository root; Bake resolves contexts relative to it.
	Files  []string // Defaults to Files.
}

// Render prints the definition of the named targets or groups. vars override Bake
// variables the same way environment variables do on the command line.
func (r Renderer) Render(ctx context.Context, vars map[string]string, targets ...string) (*Definition, error) {
	files := r.Files
	if len(files) == 0 {
		files = Files
	}
	args := []string{"buildx", "bake", "--print"}
	for _, f := range files {
		args = append(args, "--file", f)
	}
	args = append(args, targets...)

	var env []string
	for _, k := range slices.Sorted(maps.Keys(vars)) {
		env = append(env, k+"="+vars[k])
	}

	var stdout bytes.Buffer
	cmd := run.Cmd{Name: "docker", Args: args, Dir: r.Root, Env: env, Stdout: &stdout}
	if err := r.Runner.Run(ctx, cmd); err != nil {
		return nil, fmt.Errorf("render bake graph: %w", err)
	}
	return Parse(stdout.Bytes())
}
