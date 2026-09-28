---
name: Helm
description: Install the T3 Code web GUI on Kubernetes from a Helm chart as a Deployment and Service, then pair a browser through kubectl port-forward.
usecase: Shared cluster instance from a Helm chart
keywords: [web gui, kubernetes, deployment, port-forward]
---

# Run T3 Code with Helm

The [`chart/`](./chart/) installs [T3 Code](../../README.md) as a Deployment and a
ClusterIP Service, both named `<release>-t3code`.

## Prerequisites

- Helm 3 and a Kubernetes cluster.

## Run T3 Code

```bash
helm install t3code ./chart
kubectl rollout status deploy/t3code-t3code
kubectl logs deploy/t3code-t3code | grep Token:
kubectl port-forward svc/t3code-t3code 3773:3773
```

Open `http://localhost:3773/pair#token=<token>` to pair your browser, then sign in to
an agent from the UI. The token expires after five minutes; for a new pair URL, run:

```bash
kubectl exec deploy/t3code-t3code -- t3 auth pairing create --base-url http://localhost:3773
```

## Values

| Value | Default | Purpose |
|---|---|---|
| `image.repository` | `ghcr.io/hambn/t3code` | Image repository. |
| `image.tag` | `ubuntu-browser` | Image tag. Set `ubuntu-browser@sha256:<digest>` to pin one build. |
| `image.pullPolicy` | `Always` | Pull policy. |
| `service.port` | `3773` | Service port. |
| `resources` | 100m CPU and 256Mi requested; 2 CPU and 2Gi limit | Container resources. |

## Workspace

`/workspace` is an `emptyDir` that is removed with the pod. T3 Code's state and the
agent logins reset whenever the container restarts. Edit
[`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) to mount
persistent volumes.

The Service is cluster-internal. Put an authenticating Ingress in front before you
expose it.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) holds the chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) holds the defaults above.
- [`chart/templates/deployment.yaml`](./chart/templates/deployment.yaml) defines the Deployment and Service.

## Cleanup

```bash
helm uninstall t3code
```
