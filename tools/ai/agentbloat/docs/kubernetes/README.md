---
name: Kubernetes
description: Keep one agentbloat pod running as a Kubernetes Deployment and open a shell in it with kubectl exec to run any of its eight agent CLIs.
usecase: Long-lived cluster workspace from plain manifests
keywords: [coding agents, deployment, kubectl exec]
---

# Run agentbloat with Kubernetes

[`deployment.yaml`](./deployment.yaml) keeps one [agentbloat](../../README.md) pod
running with `sleep infinity`, so you can open shells in it with `kubectl exec`.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.

## Open a shell

```bash
kubectl apply -f deployment.yaml
kubectl exec -it deploy/agentbloat -- zsh -l
```

Run `cd /workspace`, then any agent, and sign in from its prompt. To supply API keys
instead, add `env` entries that read them from a Secret with `secretKeyRef`.

## Workspace

`/workspace` is an `emptyDir`: it survives container restarts but not a new pod. Agent
logins are in the container's home directory and reset whenever the container restarts.
Mount a PersistentVolumeClaim at `/workspace`, and at an agent's config directory,
such as `/home/sysadmin/.codex`, to keep its login. A volume over all of
`/home/sysadmin` would hide the shell configuration in the image. The pod runs as UID 1000 with all capabilities dropped.

## Files

- [`deployment.yaml`](./deployment.yaml) defines the single-replica Deployment with resource limits.

## Cleanup

```bash
kubectl delete -f deployment.yaml
```
