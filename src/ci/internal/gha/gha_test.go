package gha

import (
	"bytes"
	"os"
	"path/filepath"
	"regexp"
	"testing"
)

func TestSetOutputWritesDelimitedMultilineValue(t *testing.T) {
	t.Parallel()
	path := filepath.Join(t.TempDir(), "output")
	a := New(new(bytes.Buffer), func(name string) string {
		if name == "GITHUB_OUTPUT" {
			return path
		}
		return ""
	})

	if err := a.SetOutput("jobs", "line one\nline two"); err != nil {
		t.Fatal(err)
	}
	if err := a.SetJSONOutput("targets", []string{"core-alpine"}); err != nil {
		t.Fatal(err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	want := regexp.MustCompile(`^jobs<<(ghadelim_\w+)\nline one\nline two\n(ghadelim_\w+)\ntargets<<(ghadelim_\w+)\n\["core-alpine"\]\n(ghadelim_\w+)\n$`)
	m := want.FindStringSubmatch(string(data))
	if m == nil {
		t.Fatalf("unexpected output file:\n%s", data)
	}
	if m[1] != m[2] || m[3] != m[4] || m[1] == m[3] {
		t.Fatalf("delimiters must pair up and differ per output: %q", m[1:])
	}
}

func TestOutsideActionsEverythingIsLogged(t *testing.T) {
	t.Parallel()
	var log bytes.Buffer
	a := New(&log, func(string) string { return "" })

	if err := a.SetOutput("publish", "false"); err != nil {
		t.Fatal(err)
	}
	a.Errorf("100%% broken\nsecond line")

	want := "publish=false\n::error::100%25 broken%0Asecond line\n"
	if log.String() != want {
		t.Fatalf("log = %q, want %q", log.String(), want)
	}
}
