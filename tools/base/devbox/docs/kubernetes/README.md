---
name: Kubernetes
description: Run devbox as a disposable non-root Kubernetes development pod, exec into it, and copy files in and out with kubectl.
usecase: Disposable cluster development pod
keywords: [kubectl exec, kubectl cp, pod, emptydir]
---

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
