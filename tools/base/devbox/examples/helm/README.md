# devbox · Helm

Install [devbox](../../README.md) as a long-running development pod with a persistent
`/workspace` volume.

## Prerequisites

- A Kubernetes cluster with a default StorageClass
- Helm 3 or later

## Commands

```bash
helm install devbox ./chart
kubectl exec -it devbox-0 -- zsh -l
```

Switch variant or resize the workspace:

```bash
helm upgrade devbox ./chart --set image.tag=alpine-full --set workspace.size=20Gi
```

## Variables

Chart values in [`chart/values.yaml`](./chart/values.yaml):

| Value | Default | Purpose |
|---|---|---|
| `image.tag` | `ubuntu-full` | Any variant from the [image table](../../README.md#images) or an immutable tag |
| `workspace.size` | `10Gi` | Size of the `/workspace` PersistentVolumeClaim |
| `workspace.storageClassName` | cluster default | StorageClass for the workspace |
| `resources` | 250m/512Mi requests, 2/4Gi limits | Container resources |

## Workspace

A StatefulSet volume claim keeps `/workspace` across pod restarts and upgrades.

## Files

- [`chart/Chart.yaml`](./chart/Chart.yaml) — chart metadata
- [`chart/values.yaml`](./chart/values.yaml) — defaults
- [`chart/templates/statefulset.yaml`](./chart/templates/statefulset.yaml) — the pod and its volume claim

## Cleanup

```bash
helm uninstall devbox
kubectl delete pvc workspace-devbox-0
```

## Limitations

- `allowPrivilegeEscalation: false` disables `sudo` and the `ping` capability.
- No Docker daemon or systemd inside the pod.
