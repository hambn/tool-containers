package ops

import (
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

func TestBuildContinuesAfterToolFailure(t *testing.T) {
	dir := t.TempDir()
	script := `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CALLS"
case "$*" in *first*output=type=cacheonly*) exit 1;; esac
exit 0
`
	if err := os.WriteFile(filepath.Join(dir, "docker"), []byte(script), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "container-structure-test"), []byte("#!/bin/sh\nexit 0\n"), 0755); err != nil {
		t.Fatal(err)
	}
	calls := filepath.Join(dir, "calls")
	t.Setenv("FAKE_CALLS", calls)
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	g := graph.Graph{Target: map[string]graph.Target{"first": {Context: "src/tools/ci/first"}, "second": {Context: "src/tools/ci/second"}}}
	err := Build(g, []string{"first", "second"}, []string{"amd64"}, filepath.Join(dir, "result"), false, false)
	if err == nil {
		t.Fatal("failed first tool was ignored")
	}
	data, err := os.ReadFile(calls)
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "second") || !strings.Contains(string(data), "output=type=docker") {
		t.Fatalf("later tool did not finish: %s", data)
	}
}
func TestMissingArchitectureDigestPreventsPublish(t *testing.T) {
	dir := t.TempDir()
	g := graph.Graph{Target: map[string]graph.Target{"sample": {Tags: []string{"ghcr.io/hambn/sample:latest"}}}}
	if err := os.WriteFile(filepath.Join(dir, "sample-amd64"), []byte("sha256:"+strings.Repeat("a", 64)), 0644); err != nil {
		t.Fatal(err)
	}
	err := publishOne(g, g, g, "sample", dir, filepath.Join(dir, "subjects"))
	if err == nil || !strings.Contains(err.Error(), "arm64 digest") {
		t.Fatalf("unexpected error %v", err)
	}
}
func TestRewriteReadmeLinks(t *testing.T) {
	got := RewriteReadme("src/tools/ci/sample/README.md", "[file](./Dockerfile) ![img](./icon.png) [web](https://example.com)")
	if !strings.Contains(got, "/blob/main/src/tools/ci/sample/Dockerfile") || !strings.Contains(got, "raw.githubusercontent.com/hambn/tool-containers/main/src/tools/ci/sample/icon.png") || !strings.Contains(got, "[web](https://example.com)") {
		t.Fatal(got)
	}
}
func TestPublishContinuesPastMissingDigest(t *testing.T) {
	dir := t.TempDir()
	digest := "sha256:" + strings.Repeat("a", 64)
	docker := `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CALLS"
case "$*" in
 *"--print"*)
  if [ "$TAG_SET" = immutable ]; then tags='[]'; else tags='["ghcr.io/hambn/first:latest","docker.io/hambn/first:latest"]'; fi
  if [ "$TAG_SET" = immutable ]; then second='[]'; else second='["ghcr.io/hambn/second:latest","docker.io/hambn/second:latest"]'; fi
  printf '{"target":{"first":{"context":"src/tools/ci/first","tags":%s},"second":{"context":"src/tools/ci/second","tags":%s}}}\n' "$tags" "$second"
  ;;
 *"imagetools inspect"*) printf '{"digest":"'"$FAKE_DIGEST"'"}\n';;
 *) exit 0;;
esac
`
	if err := os.WriteFile(filepath.Join(dir, "docker"), []byte(docker), 0755); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "cosign"), []byte("#!/bin/sh\nprintf '%s\\n' \"$*\" >> \"$FAKE_CALLS\"\n"), 0755); err != nil {
		t.Fatal(err)
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	t.Setenv("FAKE_DIGEST", digest)
	calls := filepath.Join(dir, "calls")
	t.Setenv("FAKE_CALLS", calls)
	digests := filepath.Join(dir, "digests")
	if err := os.Mkdir(digests, 0755); err != nil {
		t.Fatal(err)
	}
	for _, arch := range []string{"amd64", "arm64"} {
		if err := os.WriteFile(filepath.Join(digests, "second-"+arch), []byte(digest), 0644); err != nil {
			t.Fatal(err)
		}
	}
	err := Publish([]string{"first", "second"}, digests, filepath.Join(dir, "subjects"))
	if err == nil {
		t.Fatal("missing digest did not fail run")
	}
	data, err := os.ReadFile(filepath.Join(dir, "subjects"))
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(string(data), "second") || strings.Contains(string(data), "first") {
		t.Fatal(string(data))
	}
}
func TestCleanupKeepsTaggedDescendantsAndReferrers(t *testing.T) {
	dir := t.TempDir()
	a := "sha256:" + strings.Repeat("a", 64)
	b := "sha256:" + strings.Repeat("b", 64)
	c := "sha256:" + strings.Repeat("c", 64)
	d := "sha256:" + strings.Repeat("d", 64)
	gh := `#!/bin/sh
printf '%s\n' "$*" >> "$FAKE_CALLS"
case "$*" in *"--paginate"*) printf '%s\n' "$FAKE_VERSIONS";; esac
`
	docker := `#!/bin/sh
case "$*" in
 *"@""$FAKE_A"*) printf '{"manifests":[{"digest":"%s"}]}\n' "$FAKE_B";;
 *"@""$FAKE_D"*) printf '{"subject":{"digest":"%s"}}\n' "$FAKE_A";;
 *) printf '{}\n';;
esac
`
	for name, script := range map[string]string{"gh": gh, "docker": docker} {
		if err := os.WriteFile(filepath.Join(dir, name), []byte(script), 0755); err != nil {
			t.Fatal(err)
		}
	}
	t.Setenv("PATH", dir+":"+os.Getenv("PATH"))
	calls := filepath.Join(dir, "calls")
	t.Setenv("FAKE_CALLS", calls)
	t.Setenv("FAKE_A", a)
	t.Setenv("FAKE_B", b)
	t.Setenv("FAKE_D", d)
	versions := ""
	for i, item := range []struct {
		digest string
		tag    string
	}{{a, "latest"}, {b, ""}, {c, ""}, {d, ""}} {
		tags := "[]"
		if item.tag != "" {
			tags = `["latest"]`
		}
		versions += fmt.Sprintf(`{"id":%d,"name":%q,"updated_at":"2020-01-01T00:00:00Z","metadata":{"container":{"tags":%s}}}`+"\n", i+1, item.digest, tags)
	}
	t.Setenv("FAKE_VERSIONS", versions)
	if err := Cleanup([]string{"sample"}, 14*24*time.Hour, false); err != nil {
		t.Fatal(err)
	}
	data, err := os.ReadFile(calls)
	if err != nil {
		t.Fatal(err)
	}
	if strings.Count(string(data), "--method DELETE") != 1 || !strings.Contains(string(data), "/versions/3") {
		t.Fatalf("unsafe deletion: %s", data)
	}
}
func TestUpdateOSRefresh(t *testing.T) {
	source := "# pins\nvariable \"OS_REFRESH\" {\n  default = \"2026-01-01\"\n}\nvariable \"OTHER\" {\n  default = \"unchanged\"\n}\n"
	got, err := UpdateOSRefresh(source, "2026-09-25")
	if err != nil {
		t.Fatal(err)
	}
	if !strings.Contains(got, "2026-09-25") || !strings.Contains(got, "unchanged") || strings.Contains(got, "2026-01-01") {
		t.Fatal(got)
	}
	if _, err := UpdateOSRefresh("variable \"OTHER\" {}", "2026-09-25"); err == nil {
		t.Fatal("missing OS_REFRESH accepted")
	}
}
