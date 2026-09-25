# claude-code · Kubernetes

[`job.yaml`](./job.yaml) runs Claude Code once as a `batch/v1` Job (`claude -p "review the workspace"`) and exits.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.
- An Anthropic API key.

## Commands

```bash
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY"
kubectl apply -f job.yaml
kubectl logs -f job/claude-code
```

Edit `args` in [`job.yaml`](./job.yaml) to change the prompt or flags.

## Variables

| Name | Where | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Secret `claude-code` | Read through `secretKeyRef`; never stored in the manifest. |

## Workspace

`/workspace` is an `emptyDir`: it starts empty and is discarded with the pod. Replace it with a PVC or an init container that clones your repository for real work.

## Files

- [`job.yaml`](./job.yaml) — non-root Job with dropped capabilities, `backoffLimit: 0`, and resource limits.

## Cleanup

```bash
kubectl delete -f job.yaml
kubectl delete secret claude-code
```

## Limitations

- The Job runs non-interactively; use the Docker or Podman examples for interactive sessions.
- `ubuntu-browser` is a moving tag; pin `<version>-ubuntu-browser` or a digest for repeatable runs.
