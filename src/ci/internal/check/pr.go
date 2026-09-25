package check

import (
	"fmt"
	"regexp"
	"strings"
)

var titleRE = regexp.MustCompile(`^(build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test)(\([a-z0-9][a-z0-9._/-]*\))?!?: \S(?:.*\S)?$`)
var headingRE = regexp.MustCompile(`(?m)^##[ \t]+(.+?)[ \t]*$`)
var commentRE = regexp.MustCompile(`(?s)<!--.*?-->`)
var placeholderRE = regexp.MustCompile(`^[-*+]\s+\[[ xX]\](?:\s|$)`)

func PR(title, body, actor string) error {
	var errors []string
	if !titleRE.MatchString(title) {
		errors = append(errors, "PR title must follow Conventional Commits")
	}
	if actor == "dependabot[bot]" {
		if len(errors) > 0 {
			return fmt.Errorf("%s", strings.Join(errors, "; "))
		}
		return nil
	}
	headings := headingRE.FindAllStringSubmatchIndex(body, -1)
	seen := map[string]int{}
	for i, index := range headings {
		name := body[index[2]:index[3]]
		if name != "Summary" && name != "Validation" {
			continue
		}
		seen[name]++
		end := len(body)
		if i+1 < len(headings) {
			end = headings[i+1][0]
		}
		content := commentRE.ReplaceAllString(body[index[1]:end], "")
		meaningful := false
		for _, line := range strings.Split(content, "\n") {
			line = strings.TrimSpace(line)
			if line != "" && !strings.HasPrefix(line, "#") && !placeholderRE.MatchString(line) && line != "-" && line != "*" && line != "+" {
				meaningful = true
			}
		}
		if !meaningful {
			errors = append(errors, "## "+name+" requires meaningful details")
		}
	}
	for _, name := range []string{"Summary", "Validation"} {
		if seen[name] == 0 {
			errors = append(errors, "missing ## "+name)
		}
		if seen[name] > 1 {
			errors = append(errors, "repeated ## "+name)
		}
	}
	if len(errors) > 0 {
		return fmt.Errorf("%s", strings.Join(errors, "; "))
	}
	return nil
}
