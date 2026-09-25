# t3code · Kubernetes

[`deployment.yaml`](./deployment.yaml) runs the T3 Code web GUI as a Deployment with a ClusterIP Service on port 3773.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.

## Commands

```bash
kubectl apply -f deployment.yaml
kubectl port-forward svc/t3code 3773:3773
```

Open `http://localhost:3773` and authenticate the agents from the T3 Code UI.

## Variables

None. Agent credentials are entered in the UI.

## Workspace

`/workspace` is an `emptyDir`: it survives container restarts but not pod replacement. Use a PVC for persistent work.

## Files

- [`deployment.yaml`](./deployment.yaml) — non-root Deployment with HTTP probes, plus the `t3code` Service.

## Cleanup

```bash
kubectl delete -f deployment.yaml
```

## Limitations

- The Service is cluster-internal; add an authenticating Ingress before exposing it.
- Agent logins are lost when the pod is replaced.
