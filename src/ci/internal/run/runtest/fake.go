// Package runtest provides a scripted run.Runner for tests.
package runtest

import (
	"context"
	"io"
	"slices"
	"strings"
	"sync"

	"github.com/hambn/tool-containers/src/ci/internal/run"
)

// Fake records every command and answers it with Handle. A nil Handle succeeds with
// no output. Fake is safe for concurrent use.
type Fake struct {
	// Handle may write to c.Stdout and return an error such as *run.ExitError.
	Handle func(ctx context.Context, c run.Cmd) error

	mu    sync.Mutex
	calls []run.Cmd
}

func (f *Fake) Run(ctx context.Context, c run.Cmd) error {
	f.mu.Lock()
	f.calls = append(f.calls, c)
	f.mu.Unlock()
	if f.Handle == nil {
		return nil
	}
	if c.Stdout == nil {
		c.Stdout = io.Discard
	}
	return f.Handle(ctx, c)
}

// Calls returns the recorded commands in the order they started.
func (f *Fake) Calls() []run.Cmd {
	f.mu.Lock()
	defer f.mu.Unlock()
	return slices.Clone(f.calls)
}

// CallsTo returns the recorded invocations of the named program.
func (f *Fake) CallsTo(name string) []run.Cmd {
	var out []run.Cmd
	for _, c := range f.Calls() {
		if c.Name == name {
			out = append(out, c)
		}
	}
	return out
}

// Fail returns an exit error, as a real command exiting with code would.
func Fail(c run.Cmd, code int, stderr string) error {
	return &run.ExitError{Cmd: c.String(), Code: code, Stderr: strings.TrimSpace(stderr)}
}
