// Command ci runs the repository's automation: it plans, builds, tests, and publishes
// the images described by the Bake files in src/tools, validates repository contracts,
// and performs scheduled maintenance.
//
// Docker Buildx Bake stays the only build definition. ci renders the Bake graph and
// passes CI-only settings (platforms, caches, outputs) as overrides, so images build
// the same way with plain `docker buildx bake`.
//
// Usage:
//
//	ci <command> [flags]
//
// Run `ci help` for the command list and `ci <command> -h` for its flags.
package main

import (
	"context"
	"errors"
	"flag"
	"fmt"
	"io"
	"os"
	"os/signal"
	"path/filepath"
	"slices"
	"syscall"
	"text/tabwriter"

	"github.com/hambn/tool-containers/src/ci/internal/gha"
	"github.com/hambn/tool-containers/src/ci/internal/run"
)

// env is what every command receives: where the repository is, how to talk to the
// runner, and how to execute programs.
type env struct {
	root    string // Repository root; Bake contexts are relative to it.
	actions *gha.Actions
	runner  run.Runner
	getenv  func(string) string
	stdout  io.Writer
}

// command is one subcommand. run receives the arguments after the command name.
type command struct {
	name    string
	summary string
	run     func(ctx context.Context, e *env, args []string) error
}

// commands lists every subcommand. Each group lives in its own file.
func commands() []command {
	return slices.Concat(imageCommands, checkCommands, maintenanceCommands)
}

func main() {
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	e := &env{
		actions: gha.New(os.Stderr, os.Getenv),
		runner:  run.Exec{},
		getenv:  os.Getenv,
		stdout:  os.Stdout,
	}
	if err := dispatch(ctx, e, os.Args[1:]); err != nil {
		if errors.Is(err, flag.ErrHelp) {
			os.Exit(2)
		}
		e.actions.Errorf("%v", err)
		os.Exit(1)
	}
}

func dispatch(ctx context.Context, e *env, args []string) error {
	if len(args) == 0 || args[0] == "help" || args[0] == "-h" || args[0] == "--help" {
		usage(e.stdout)
		return nil
	}
	i := slices.IndexFunc(commands(), func(c command) bool { return c.name == args[0] })
	if i < 0 {
		usage(os.Stderr)
		return fmt.Errorf("unknown command %q", args[0])
	}
	if e.root == "" {
		root, err := findRoot()
		if err != nil {
			return err
		}
		e.root = root
	}
	return commands()[i].run(ctx, e, args[1:])
}

func usage(w io.Writer) {
	fmt.Fprintln(w, "usage: ci <command> [flags]\n\ncommands:")
	tw := tabwriter.NewWriter(w, 0, 0, 2, ' ', 0)
	for _, c := range commands() {
		fmt.Fprintf(tw, "  %s\t%s\n", c.name, c.summary)
	}
	tw.Flush()
}

// findRoot walks up from the working directory to the directory holding src/tools,
// so ci works from any subdirectory of the checkout.
func findRoot() (string, error) {
	dir, err := os.Getwd()
	if err != nil {
		return "", err
	}
	for {
		if info, err := os.Stat(filepath.Join(dir, "src", "tools")); err == nil && info.IsDir() {
			return dir, nil
		}
		parent := filepath.Dir(dir)
		if parent == dir {
			return "", errors.New("not inside a tool-containers checkout (no src/tools above the working directory)")
		}
		dir = parent
	}
}

// newFlags returns a flag set whose errors are returned rather than exiting, with a
// usage line naming the command.
func newFlags(name, argsUsage string) *flag.FlagSet {
	fs := flag.NewFlagSet(name, flag.ContinueOnError)
	fs.Usage = func() {
		fmt.Fprintf(fs.Output(), "usage: ci %s [flags] %s\n", name, argsUsage)
		fs.PrintDefaults()
	}
	return fs
}
