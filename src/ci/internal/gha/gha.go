// Package gha writes GitHub Actions workflow commands, step outputs, and job
// summaries. Outside Actions it degrades to plain text on the given writer, so every
// command also runs locally.
package gha

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
)

// Actions is the job's view of the runner. It is safe for concurrent use.
type Actions struct {
	mu          sync.Mutex
	log         io.Writer
	outputPath  string // $GITHUB_OUTPUT; empty when not running in Actions.
	summaryPath string // $GITHUB_STEP_SUMMARY.
}

// New returns an Actions that logs to w and reads file-command paths from getenv.
func New(w io.Writer, getenv func(string) string) *Actions {
	return &Actions{
		log:         w,
		outputPath:  getenv("GITHUB_OUTPUT"),
		summaryPath: getenv("GITHUB_STEP_SUMMARY"),
	}
}

// Log returns the writer for ordinary log lines.
func (a *Actions) Log() io.Writer { return a.log }

// Printf writes one log line.
func (a *Actions) Printf(format string, args ...any) {
	a.mu.Lock()
	defer a.mu.Unlock()
	fmt.Fprintf(a.log, format+"\n", args...)
}

// Group runs fn inside a collapsible log group.
func (a *Actions) Group(title string, fn func() error) error {
	a.Printf("::group::%s", escapeData(title))
	defer a.Printf("::endgroup::")
	return fn()
}

// Errorf emits an error annotation, shown on the run summary.
func (a *Actions) Errorf(format string, args ...any) {
	a.Printf("::error::%s", escapeData(fmt.Sprintf(format, args...)))
}

// Warningf emits a warning annotation.
func (a *Actions) Warningf(format string, args ...any) {
	a.Printf("::warning::%s", escapeData(fmt.Sprintf(format, args...)))
}

// SetOutput sets a step output. Values may span lines.
func (a *Actions) SetOutput(name, value string) error {
	if a.outputPath == "" {
		a.Printf("%s=%s", name, value)
		return nil
	}
	delim, err := delimiter()
	if err != nil {
		return err
	}
	if strings.Contains(value, delim) {
		return fmt.Errorf("output %s contains its delimiter", name)
	}
	return a.appendFile(a.outputPath, fmt.Sprintf("%s<<%s\n%s\n%s\n", name, delim, value, delim))
}

// SetJSONOutput sets a step output to the compact JSON encoding of v, for fromJSON.
func (a *Actions) SetJSONOutput(name string, v any) error {
	data, err := json.Marshal(v)
	if err != nil {
		return fmt.Errorf("encode output %s: %w", name, err)
	}
	return a.SetOutput(name, string(data))
}

// Summary appends Markdown to the job summary. Outside Actions it is logged.
func (a *Actions) Summary(markdown string) error {
	if a.summaryPath == "" {
		a.Printf("%s", markdown)
		return nil
	}
	return a.appendFile(a.summaryPath, markdown+"\n")
}

func (a *Actions) appendFile(path, text string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return err
	}
	if _, err := f.WriteString(text); err != nil {
		f.Close()
		return err
	}
	return f.Close()
}

func delimiter() (string, error) {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return "ghadelim_" + hex.EncodeToString(b), nil
}

// escapeData escapes a workflow command message as the runner expects.
func escapeData(s string) string {
	return strings.NewReplacer("%", "%25", "\r", "%0D", "\n", "%0A").Replace(s)
}
