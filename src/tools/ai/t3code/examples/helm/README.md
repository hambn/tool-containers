# t3code · Helm

The [`chart/`](./chart/) installs the T3 Code web GUI as a Deployment plus Service.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- Helm 3.8 or newer and a Kubernetes cluster.

## Commands

```bash
helm install t3code ./chart
kubectl port-forward svc/t3code-t3code 3773:3773
```

Open `http://localhost:3773` and authenticate the agents from the T3 Code UI.

## Variables

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/t3code` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag; pin `<version>-<variant>` for repeatable runs. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `service.port` | `3773` | Service port. |
| `resources` | 100m/256Mi requests, 2 CPU/2Gi limits | Container resources. |

## Workspace

`/workspace` is an `emptyDir` discarded with the pod.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) — chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) — defaults listed above.
- [`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) — Deployment and Service.

## Cleanup

```bash
helm uninstall t3code
```

## Limitations

- The Service is cluster-internal; add an authenticating Ingress before exposing it.
