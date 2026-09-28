---
name: Helm
description: Install Claude Code as a one-shot Kubernetes Job with a Helm chart that reviews the workspace, reading ANTHROPIC_API_KEY from a Secret.
usecase: One-shot review in a cluster from a Helm chart
keywords: [kubernetes job, kubernetes secret, anthropic api key, code review]
---

# claude-code · Helm

The [`chart/`](./chart/) installs Claude Code as a one-shot `batch/v1` Job.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Helm 3.8 or newer and a Kubernetes cluster.
- An Anthropic API key.

## Commands

```bash
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
helm install claude-code ./chart --set-json 'args=["-p","review the workspace"]'
kubectl logs -f job/claude-code-claude-code
```

## Variables

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/claude-code` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag; append `@sha256:<digest>` (for example `ubuntu-browser@sha256:<digest>`) to pin it. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `args` | `["-p", "review the workspace"]` | Arguments passed to `claude`. |
| `apiKeySecret` | `claude-code` | Secret holding key `ANTHROPIC_API_KEY`. |
| `resources` | 100m/256Mi requests, 1 CPU/1Gi limits | Container resources. |

## Workspace

`/workspace` is an `emptyDir` discarded with the pod.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) — chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) — defaults listed above.
- [`chart/templates/job.yaml`](./chart/templates/job.yaml) — non-root Job with `backoffLimit: 0`.

## Cleanup

```bash
helm uninstall claude-code
kubectl delete secret claude-code
```

## Limitations

- A Job's pod template is immutable; `helm uninstall` before installing a new run.
