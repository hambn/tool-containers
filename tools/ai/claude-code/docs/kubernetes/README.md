---
name: Kubernetes
description: Run Claude Code once as a Kubernetes Job in print mode, reading the Anthropic API key from a Secret and working on a volume you attach.
usecase: One-shot review in a cluster from plain manifests
keywords: [batch job, kubectl, secret, anthropic api key, code review]
---

# Run Claude Code with Kubernetes

[`job.yaml`](./job.yaml) runs [Claude Code](../../README.md) once as a Job with
`claude -p "review the workspace"`, prints the answer to the pod log, and exits.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.
- An Anthropic API key.

## Run the Job

```bash
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
kubectl apply -f job.yaml
kubectl logs -f job/claude-code
```

Edit `args` in [`job.yaml`](./job.yaml) to change the prompt or flags. The Job uses
`ghcr.io/hambn/claude-code:ubuntu-browser`; replace the tag with `@sha256:<digest>` to
pin one build.

## Variables

| Name | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Secret `claude-code` | Read through `secretKeyRef`, so the key is not in the manifest. |

## Workspace

As shipped, `/workspace` is an empty `emptyDir`, so the default prompt has nothing to
review. Replace the volume with a PersistentVolumeClaim that holds your code, or add an
init container that clones your repository into it.

## Files

- [`job.yaml`](./job.yaml) is a non-root Job with all capabilities dropped,
  `backoffLimit: 0`, and CPU and memory limits.

## Cleanup

```bash
kubectl delete -f job.yaml
kubectl delete secret claude-code
```

A finished Job stays until you delete it. Delete it before applying the manifest again
to start a new run.
