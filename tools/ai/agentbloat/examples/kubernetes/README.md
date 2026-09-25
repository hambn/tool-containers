# agentbloat · Kubernetes

[`deployment.yaml`](./deployment.yaml) keeps one agentbloat pod running (`sleep infinity`) so you can `kubectl exec` into a shell with every bundled agent CLI.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.

## Commands

```bash
kubectl apply -f deployment.yaml
kubectl exec -it deploy/agentbloat -- zsh -l
```

## Variables

None. Sign in to each agent CLI inside the pod, or add `env` entries backed by `secretKeyRef` for API keys.

## Workspace

`/workspace` is an `emptyDir`: it survives container restarts but not pod replacement. Use a PVC for persistent work.

## Files

- [`deployment.yaml`](./deployment.yaml) — single-replica, non-root Deployment with dropped capabilities and resource limits.

## Cleanup

```bash
kubectl delete -f deployment.yaml
```

## Limitations

- Agent logins stored in the home directory are lost when the pod is replaced.
- `ubuntu-browser` is a moving tag; pin a `ubuntu-browser-<YYYYMMDD>-<sha7>` tag or a digest for repeatable runs.
