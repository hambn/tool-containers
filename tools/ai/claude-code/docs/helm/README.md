---
name: Helm
description: Install Claude Code as a one-shot Kubernetes Job from a Helm chart, with the prompt set in values and the API key read from a Secret.
usecase: One-shot review in a cluster from a Helm chart
keywords: [kubernetes job, kubernetes secret, anthropic api key, code review]
---

# Run Claude Code with Helm

The [`chart/`](./chart/) installs [Claude Code](../../README.md) as a Job that runs
`claude` once with the arguments in `args` and exits.

## Prerequisites

- Helm 3.10 or later, for `--set-json`, and a Kubernetes cluster.
- An Anthropic API key.

## Install

```bash
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
helm install claude-code ./chart
kubectl logs -f job/claude-code-claude-code
```

Set a different prompt at install time:

```bash
helm install claude-code ./chart --set-json 'args=["-p","list the failing tests"]'
```

## Values

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/claude-code` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag. Use `ubuntu-browser@sha256:<digest>` to pin one build. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `args` | `["-p", "review the workspace"]` | Arguments passed to `claude`. |
| `apiKeySecret` | `claude-code` | Secret that holds the `ANTHROPIC_API_KEY` key. |
| `resources` | 100m CPU and 256Mi requested, 1 CPU and 1Gi limit | Container resources. |

## Workspace

`/workspace` is an empty `emptyDir` that is deleted with the pod. Mount your code into
it by editing the volume in [`chart/templates/job.yaml`](./chart/templates/job.yaml),
for example with a PersistentVolumeClaim or a cloning init container.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) holds the chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) holds the defaults above.
- [`chart/templates/job.yaml`](./chart/templates/job.yaml) is the non-root Job with `backoffLimit: 0`.

## Cleanup

```bash
helm uninstall claude-code
kubectl delete secret claude-code
```

A Job's pod template cannot change, so uninstall the release before installing a new run.
