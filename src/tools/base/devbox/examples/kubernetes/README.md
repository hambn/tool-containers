# devbox · Kubernetes

Run [devbox](../../README.md) as a disposable development pod and exec into it.

## Prerequisites

- A Kubernetes cluster and `kubectl`

## Commands

```bash
kubectl apply -f pod.yaml
kubectl wait --for=condition=Ready pod/devbox
kubectl exec -it devbox -- zsh -l
```

Copy files in and out:

```bash
kubectl cp ./src devbox:/workspace/src
kubectl cp devbox:/workspace/out ./out
```

## Workspace

`/workspace` is an `emptyDir` and disappears with the pod; replace it with a
PersistentVolumeClaim to keep work.

## Files

- [`pod.yaml`](./pod.yaml) — non-root pod with all capabilities dropped

## Cleanup

```bash
kubectl delete -f pod.yaml
```

## Limitations

- `allowPrivilegeEscalation: false` disables `sudo` and the `ping` capability.
- There is no Docker daemon; point `DOCKER_HOST` at a remote one if needed.
- systemd does not run here; `systemctl` needs a privileged container with `/sbin/init`.
