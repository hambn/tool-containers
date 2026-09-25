package ops

import (
	"archive/tar"
	"bytes"
	"compress/gzip"
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

type download struct{ Name, URL, SHA, ArchiveMember string }

func fetch(spec download, dir string) error {
	client := http.Client{Timeout: 5 * time.Minute}
	response, err := client.Get(spec.URL)
	if err != nil {
		return err
	}
	defer response.Body.Close()
	if response.StatusCode != 200 {
		return fmt.Errorf("%s: HTTP %s", spec.URL, response.Status)
	}
	data, err := io.ReadAll(io.LimitReader(response.Body, 80<<20))
	if err != nil {
		return err
	}
	digest := sha256.Sum256(data)
	if hex.EncodeToString(digest[:]) != spec.SHA {
		return fmt.Errorf("checksum mismatch for %s", spec.Name)
	}
	if spec.ArchiveMember != "" {
		gz, err := gzip.NewReader(bytes.NewReader(data))
		if err != nil {
			return err
		}
		tr := tar.NewReader(gz)
		found := false
		for {
			header, err := tr.Next()
			if err == io.EOF {
				break
			}
			if err != nil {
				return err
			}
			if header.Name != spec.ArchiveMember {
				continue
			}
			data, err = io.ReadAll(io.LimitReader(tr, 50<<20))
			if err != nil {
				return err
			}
			found = true
			break
		}
		if !found {
			return fmt.Errorf("%s absent from archive", spec.ArchiveMember)
		}
	}
	return os.WriteFile(filepath.Join(dir, spec.Name), data, 0755)
}
func Install(kind string) error {
	dir := filepath.Join(os.Getenv("RUNNER_TEMP"), "ci-bin")
	if os.Getenv("RUNNER_TEMP") == "" {
		dir = "/tmp/ci-bin"
	}
	if err := os.MkdirAll(dir, 0755); err != nil {
		return err
	}
	var specs []download
	switch kind {
	case "cst":
		specs = []download{{"container-structure-test", "https://github.com/GoogleContainerTools/container-structure-test/releases/download/v1.22.1/container-structure-test-linux-amd64", "fa35e89512a8978585f76cf41397956d2e3a30c62c2ad3fb857b1597074d14ca", ""}}
	case "linters":
		specs = []download{{"actionlint", "https://github.com/rhysd/actionlint/releases/download/v1.7.12/actionlint_1.7.12_linux_amd64.tar.gz", "8aca8db96f1b94770f1b0d72b6dddcb1ebb8123cb3712530b08cc387b349a3d8", "actionlint"}, {"hadolint", "https://github.com/hadolint/hadolint/releases/download/v2.15.1/hadolint-linux-x86_64", "c7187db94eeeeca956519a6af171adc31453941a1e777961f6e680f697c8c507", ""}, {"shellcheck", "https://github.com/koalaman/shellcheck/releases/download/v0.11.0/shellcheck-v0.11.0.linux.x86_64.tar.gz", "b7af85e41cc99489dcc21d66c6d5f3685138f06d34651e6d34b42ec6d54fe6f6", "shellcheck-v0.11.0/shellcheck"}, {"shfmt", "https://github.com/mvdan/sh/releases/download/v3.14.1/shfmt_v3.14.1_linux_amd64", "76e77641faa025814b77f153b29796b8e6fa2fca03e0c76a691608b86c7ea7bf", ""}}
	default:
		return fmt.Errorf("unknown install kind %s", kind)
	}
	var wg sync.WaitGroup
	errors := make(chan error, len(specs))
	for _, spec := range specs {
		wg.Add(1)
		go func(spec download) {
			defer wg.Done()
			if err := fetch(spec, dir); err != nil {
				errors <- fmt.Errorf("%s: %w", spec.Name, err)
			}
		}(spec)
	}
	wg.Wait()
	close(errors)
	for err := range errors {
		return err
	}
	if path := os.Getenv("GITHUB_PATH"); path != "" {
		f, err := os.OpenFile(path, os.O_APPEND|os.O_WRONLY, 0600)
		if err != nil {
			return err
		}
		defer f.Close()
		_, err = fmt.Fprintln(f, dir)
		return err
	}
	fmt.Println(dir)
	return nil
}
func Lint() error {
	if err := Stream(nil, "actionlint", "-color"); err != nil {
		return err
	}
	files, err := Git("ls-files", "src/tools/**/Dockerfile")
	if err != nil {
		return err
	}
	args := []string{"--ignore", "DL3002", "--ignore", "DL3006", "--ignore", "DL3008", "--ignore", "DL3018", "--ignore", "DL3022", "--ignore", "DL3066", "--ignore", "DL3067"}
	args = append(args, strings.Fields(files)...)
	if len(args) > 14 {
		if err := Stream(nil, "hadolint", args...); err != nil {
			return err
		}
	}
	scripts, err := Git("ls-files", "*.sh")
	if err != nil {
		return err
	}
	if fields := strings.Fields(scripts); len(fields) > 0 {
		if err := Stream(nil, "shellcheck", fields...); err != nil {
			return err
		}
		if err := Stream(nil, "shfmt", append([]string{"-d", "-i", "4"}, fields...)...); err != nil {
			return err
		}
	}
	return nil
}
