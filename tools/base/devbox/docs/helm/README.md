---
name: Helm
description: Install devbox as a long-running Kubernetes development pod with a persistent /workspace volume using a Helm chart.
usecase: Long-running cluster pod with a persistent workspace
keywords: [kubernetes, statefulset, persistent volume]
---

# Run devbox with Helm

The chart runs [devbox](../../README.md) as a one-replica StatefulSet whose volume
claim keeps `/workspace` across restarts and upgrades.

## Prerequisites

- A Kubernetes cluster with a default StorageClass, or set `workspace.storageClassName`.
- Helm 3 or later.

## Open a shell

```bash
helm install devbox ./chart
kubectl exec -it devbox-0 -- zsh -l
```

To use a larger workspace, set its size when you install:

```bash
helm install devbox ./chart --set workspace.size=20Gi
```

Kubernetes does not let an upgrade change a StatefulSet's volume claim template, so
change only the image on an existing release:

```bash
helm upgrade devbox ./chart --reuse-values --set image.tag=alpine-full
```

## Values

| Value | Default | Purpose |
|---|---|---|
| `image.tag` | `ubuntu-full` | Any [variant](../../README.md#images). |
| `workspace.size` | `10Gi` | Size of the `/workspace` claim. |
| `workspace.storageClassName` | cluster default | StorageClass for the claim. |
| `resources` | 250m and 512Mi requested, 2 CPUs and 4Gi limit | Container resources. |

## Workspace

The pod runs as UID 1000 with every capability dropped and
`allowPrivilegeEscalation: false`, so `sudo` and `ping` fail. It runs no Docker daemon.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) holds the chart metadata.
- [`chart/values.yaml`](./chart/values.yaml) holds the defaults above.
- [`chart/templates/statefulset.yaml`](./chart/templates/statefulset.yaml) defines the StatefulSet and its volume claim.

## Cleanup

Uninstalling leaves the volume claim. Delete it to remove the workspace:

```bash
helm uninstall devbox
kubectl delete pvc workspace-devbox-0
```
