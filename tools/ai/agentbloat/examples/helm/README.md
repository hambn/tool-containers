# agentbloat · Helm

The [`chart/`](./chart/) installs a long-lived agentbloat workspace pod as a Deployment.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Helm 3.8 or newer and a Kubernetes cluster.

## Commands

```bash
helm install agentbloat ./chart
kubectl exec -it deploy/agentbloat -- zsh -l
```

## Variables

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/agentbloat` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `replicaCount` | `1` | Number of workspace pods. |
| `command` | `["sleep", "infinity"]` | Keeps the pod running for `kubectl exec`. |
| `resources` | 250m/512Mi requests, 2 CPU/4Gi limits | Container resources. |

## Workspace

`/workspace` is an `emptyDir` discarded with the pod.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) — chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) — defaults listed above.
- [`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) — non-root Deployment.

## Cleanup

```bash
helm uninstall agentbloat
```

## Limitations

- Each replica has its own `emptyDir`; replicas do not share work.
