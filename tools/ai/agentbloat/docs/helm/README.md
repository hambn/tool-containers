---
name: Helm
description: Install a long-lived agentbloat workspace pod on Kubernetes from a Helm chart, then open a shell with kubectl exec to run the agent CLIs.
usecase: Long-lived cluster workspace from a Helm chart
keywords: [coding agents, kubernetes, deployment, kubectl exec]
---

# Run agentbloat with Helm

The [`chart/`](./chart/) installs an [agentbloat](../../README.md) Deployment, named
after the release, whose pod runs `sleep infinity` so you can open shells in it.

## Prerequisites

- Helm 3 and a Kubernetes cluster.

## Open a shell

```bash
helm install agentbloat ./chart
kubectl exec -it deploy/agentbloat -- zsh -l
```

Run `cd /workspace`, then any agent, and sign in from its prompt.

## Values

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/agentbloat` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag. Set `ubuntu-browser@sha256:<digest>` to pin one build. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `replicaCount` | `1` | Number of pods. Each has its own `/workspace`. |
| `command` | `["sleep", "infinity"]` | Keeps the pod running for `kubectl exec`. |
| `resources` | 250m CPU and 512Mi requested; 2 CPU and 4Gi limit | Container resources. |

## Workspace

`/workspace` is an `emptyDir` that is removed with the pod, and agent logins reset
whenever the container restarts. Edit
[`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) to mount
persistent volumes.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) holds the chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) holds the defaults above.
- [`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) defines the non-root Deployment.

## Cleanup

```bash
helm uninstall agentbloat
```
