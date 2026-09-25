// Package run executes external programs such as docker, cosign, and trivy.
//
// Everything that shells out goes through a Runner so that tests can substitute
// runtest.Fake and assert on behavior without Docker or network access. Prefer a Go
// library over a new external program whenever one exists.
package run

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"strings"
	"syscall"
	"time"
)

// Cmd describes one program invocation. A nil Stdout or Stderr discards that stream,
// except that Exec keeps the tail of stderr for the error message.
type Cmd struct {
	Name   string
	Args   []string
	Dir    string
	Env    []string // Added to the current environment; later entries win.
	Stdin  io.Reader
	Stdout io.Writer
	Stderr io.Writer
}

// String renders the command line for logs and error messages.
func (c Cmd) String() string {
	return strings.Join(append([]string{c.Name}, c.Args...), " ")
}

// Runner runs a command to completion.
type Runner interface {
	Run(ctx context.Context, c Cmd) error
}

// Output runs c and returns its standard output.
func Output(ctx context.Context, r Runner, c Cmd) ([]byte, error) {
	var out bytes.Buffer
	c.Stdout = &out
	err := r.Run(ctx, c)
	return out.Bytes(), err
}

// ExitError reports a command that ran and exited unsuccessfully.
type ExitError struct {
	Cmd    string
	Code   int
	Stderr string // Last few kilobytes, for diagnosis.
}

func (e *ExitError) Error() string {
	msg := fmt.Sprintf("%s: exit status %d", e.Cmd, e.Code)
	if e.Stderr != "" {
		msg += "\n" + e.Stderr
	}
	return msg
}

// ExitCode returns the exit status carried by err, or -1 if err is not an ExitError.
func ExitCode(err error) int {
	if e, ok := errors.AsType[*ExitError](err); ok {
		return e.Code
	}
	return -1
}

// Exec runs commands with os/exec. Cancelling the context sends SIGTERM and, after a
// grace period, SIGKILL, so that docker and buildx can clean up.
type Exec struct{}

const stderrTail = 4 << 10

func (Exec) Run(ctx context.Context, c Cmd) error {
	cmd := exec.CommandContext(ctx, c.Name, c.Args...)
	cmd.Dir = c.Dir
	cmd.Env = append(os.Environ(), c.Env...)
	cmd.Stdin = c.Stdin
	cmd.Stdout = c.Stdout
	cmd.Cancel = func() error { return cmd.Process.Signal(syscall.SIGTERM) }
	cmd.WaitDelay = 30 * time.Second

	tail := &tailBuffer{max: stderrTail}
	if c.Stderr != nil {
		cmd.Stderr = io.MultiWriter(c.Stderr, tail)
	} else {
		cmd.Stderr = tail
	}

	err := cmd.Run()
	if exitErr, ok := errors.AsType[*exec.ExitError](err); ok {
		return &ExitError{Cmd: c.String(), Code: exitErr.ExitCode(), Stderr: tail.String()}
	}
	if err != nil {
		return fmt.Errorf("%s: %w", c.String(), err)
	}
	return nil
}

// tailBuffer keeps only the last max bytes written to it.
type tailBuffer struct {
	max int
	buf []byte
}

func (t *tailBuffer) Write(p []byte) (int, error) {
	t.buf = append(t.buf, p...)
	if over := len(t.buf) - t.max; over > 0 {
		t.buf = t.buf[over:]
	}
	return len(p), nil
}

func (t *tailBuffer) String() string { return strings.TrimSpace(string(t.buf)) }
