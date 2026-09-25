package check

import "testing"

func TestPR(t *testing.T) {
	if err := PR("ci(images): migrate validation", "## Summary\n\nGo migration.\n\n## Validation\n\n- go test ./...", "member"); err != nil {
		t.Fatal(err)
	}
	if err := PR("bad title", "## Summary\n\n- [ ]\n\n## Validation\n\n<!-- placeholder -->", "member"); err == nil {
		t.Fatal("invalid PR accepted")
	}
	if err := PR("chore: bump pin", "", "dependabot[bot]"); err != nil {
		t.Fatal(err)
	}
}
