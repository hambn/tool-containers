---
name: Kubernetes
description: Run devbox as a disposable non-root Kubernetes development pod, exec into it, and copy files in and out with kubectl.
usecase: Disposable cluster development pod
keywords: [kubectl exec, kubectl cp, pod, emptydir]
---

# Run devbox with Kubernetes

[`pod.yaml`](./pod.yaml) runs [devbox](../../README.md) as a single non-root pod that
sleeps until you open a shell in it with `kubectl exec`.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.

## Open a shell

```bash
kubectl apply -f pod.yaml
kubectl wait --for=condition=Ready pod/devbox
kubectl exec -it devbox -- zsh -l
```

Copy files in and out with `kubectl cp`:

```bash
kubectl cp ./src devbox:/workspace/src
kubectl cp devbox:/workspace/out ./out
```

## Workspace

`/workspace` is an `emptyDir` and is deleted with the pod. Replace it with a
PersistentVolumeClaim to keep your work, or use the [Helm](../helm/) recipe.

The pod runs as UID 1000 with every capability dropped and
`allowPrivilegeEscalation: false`, so `sudo` and `ping` fail. No Docker daemon runs in
the pod; set `DOCKER_HOST` to use a remote one.

## Files

- [`pod.yaml`](./pod.yaml) defines the pod, its security context, and resource limits.

## Cleanup

```bash
kubectl delete -f pod.yaml
```
