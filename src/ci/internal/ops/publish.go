package ops

import (
	"encoding/json"
	"fmt"
	"github.com/hambn/tool-containers/src/ci/internal/graph"
	"os"
	"path/filepath"
	"strings"
	"time"
)

func registryDigest(ref string) (string, error) {
	var last error
	for attempt := 1; attempt <= 3; attempt++ {
		out, err := Run(nil, "docker", "buildx", "imagetools", "inspect", ref, "--format", "{{json .Manifest}}")
		if err == nil {
			var m struct {
				Digest string `json:"digest"`
			}
			if err := json.Unmarshal(out, &m); err != nil {
				return "", err
			}
			if !validDigest(m.Digest) {
				return "", fmt.Errorf("invalid registry digest for %s", ref)
			}
			return m.Digest, nil
		}
		message := strings.ToLower(string(out))
		if strings.Contains(message, "manifest unknown") || strings.Contains(message, "manifest_unknown") || strings.Contains(message, "name_unknown") || strings.Contains(message, "404 not found") || strings.Contains(message, "status code: 404") {
			return "missing", nil
		}
		last = err
		if attempt < 3 {
			time.Sleep(time.Duration(attempt*5) * time.Second)
		}
	}
	return "", fmt.Errorf("registry inspection failed for %s: %w", ref, last)
}
func tagsFor(g graph.Graph, target, registry string) []string {
	var out []string
	for _, tag := range g.Target[target].Tags {
		if strings.HasPrefix(tag, registry+"/") {
			out = append(out, tag)
		}
	}
	return out
}
func publishTags(moving, immutable graph.Graph, target, registry string) ([]string, error) {
	tags := tagsFor(moving, target, registry)
	for _, tag := range tagsFor(immutable, target, registry) {
		d, err := registryDigest(tag)
		if err != nil {
			return nil, err
		}
		if d == "missing" {
			tags = append(tags, tag)
		} else {
			fmt.Fprintf(os.Stderr, "::notice::%s already exists; left unchanged\n", tag)
		}
	}
	if len(tags) == 0 {
		return nil, fmt.Errorf("%s has no %s tags", target, registry)
	}
	return tags, nil
}
func verifyTags(digest string, tags []string) error {
	for _, tag := range tags {
		got, err := registryDigest(tag)
		if err != nil {
			return err
		}
		if got != digest {
			return fmt.Errorf("%s resolves to %s, expected %s", tag, got, digest)
		}
	}
	return nil
}
func publishOne(g, moving, immutable graph.Graph, target, digestDir, subjects string) error {
	t := g.Target[target]
	if len(t.Tags) == 0 {
		return fmt.Errorf("%s has no image tags", target)
	}
	repo := strings.Split(strings.Split(t.Tags[0], "/")[len(strings.Split(t.Tags[0], "/"))-1], ":")[0]
	ghcr := "ghcr.io/hambn/" + repo
	hub := "docker.io/hambn/" + repo
	var sources []string
	for _, arch := range []string{"amd64", "arm64"} {
		data, err := os.ReadFile(filepath.Join(digestDir, target+"-"+arch))
		if err != nil {
			return fmt.Errorf("%s has no %s digest", target, arch)
		}
		d := strings.TrimSpace(string(data))
		if !validDigest(d) {
			return fmt.Errorf("%s has invalid %s digest", target, arch)
		}
		sources = append(sources, ghcr+"@"+d)
	}
	ghcrTags, err := publishTags(moving, immutable, target, "ghcr.io/hambn")
	if err != nil {
		return err
	}
	args := []string{"buildx", "imagetools", "create"}
	for key, value := range t.Labels {
		args = append(args, "--annotation", "index:"+key+"="+value)
	}
	for _, tag := range ghcrTags {
		args = append(args, "--tag", tag)
	}
	args = append(args, sources...)
	if err := Stream(nil, "docker", args...); err != nil {
		return err
	}
	movingGHCR := tagsFor(moving, target, "ghcr.io/hambn")
	if len(movingGHCR) == 0 {
		return fmt.Errorf("%s lacks moving GHCR tag", target)
	}
	digest, err := registryDigest(movingGHCR[0])
	if err != nil {
		return err
	}
	if err := verifyTags(digest, movingGHCR); err != nil {
		return err
	}
	hubTags, err := publishTags(moving, immutable, target, "docker.io/hambn")
	if err != nil {
		return err
	}
	movingHub := tagsFor(moving, target, "docker.io/hambn")
	if len(movingHub) == 0 {
		return fmt.Errorf("%s lacks moving Hub tag", target)
	}
	for attempt := 1; attempt <= 3; attempt++ {
		args = []string{"buildx", "imagetools", "create"}
		for _, tag := range hubTags {
			args = append(args, "--tag", tag)
		}
		args = append(args, ghcr+"@"+digest)
		if err := Stream(nil, "docker", args...); err != nil {
			return err
		}
		if err := verifyTags(digest, movingHub); err == nil {
			break
		} else if attempt == 3 {
			return err
		}
		time.Sleep(time.Duration(attempt*10) * time.Second)
	}
	if err := Stream(nil, "cosign", "sign", "--yes", ghcr+"@"+digest, hub+"@"+digest); err != nil {
		return err
	}
	f, err := os.OpenFile(subjects, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0644)
	if err != nil {
		return err
	}
	defer f.Close()
	_, err = fmt.Fprintf(f, "%s  %s\n%s  index.docker.io/hambn/%s\n", strings.TrimPrefix(digest, "sha256:"), ghcr, strings.TrimPrefix(digest, "sha256:"), repo)
	return err
}
func Publish(targets []string, digestDir, subjects string) error {
	g, err := Print(nil, targets...)
	if err != nil {
		return err
	}
	moving, err := Print([]string{"TAG_SET=moving"}, targets...)
	if err != nil {
		return err
	}
	immutable, err := Print([]string{"TAG_SET=immutable"}, targets...)
	if err != nil {
		return err
	}
	failed := false
	for _, target := range targets {
		if err := publishOne(g, moving, immutable, target, digestDir, subjects); err != nil {
			failed = true
			fmt.Fprintf(os.Stderr, "::error::%s not published: %v\n", target, err)
		}
	}
	if failed {
		return fmt.Errorf("one or more targets were not published")
	}
	return nil
}
