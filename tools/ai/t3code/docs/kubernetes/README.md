---
name: Kubernetes
description: Run the T3 Code web GUI as a Kubernetes Deployment with a ClusterIP Service on port 3773, then pair a browser through kubectl port-forward.
usecase: Shared cluster instance from plain manifests
keywords: [web gui, deployment, clusterip service, port-forward]
---

# Run T3 Code with Kubernetes

[`deployment.yaml`](./deployment.yaml) runs [T3 Code](../../README.md) as a Deployment
named `t3code` with a ClusterIP Service of the same name on port 3773.

## Prerequisites

- A Kubernetes cluster and `kubectl` configured for it.

## Run T3 Code

```bash
kubectl apply -f deployment.yaml
kubectl rollout status deploy/t3code
kubectl logs deploy/t3code | grep Token:
kubectl port-forward svc/t3code 3773:3773
```

Open `http://localhost:3773/pair#token=<token>` to pair your browser, then sign in to
an agent from the UI. The token expires after five minutes; for a new pair URL, run:

```bash
kubectl exec deploy/t3code -- t3 auth pairing create --base-url http://localhost:3773
```

## Workspace

`/workspace` is an `emptyDir`: it survives container restarts but not a new pod. T3
Code's state and the agent logins are in the container's home directory, which resets
whenever the container restarts. Mount a PersistentVolumeClaim at `/workspace`, and at
`/home/sysadmin/.t3` if you need them to last. The pod runs as UID 1000 with all
capabilities dropped.

The Service is cluster-internal. Put an authenticating Ingress in front before you
expose it.

## Files

- [`deployment.yaml`](./deployment.yaml) defines the Deployment, with HTTP probes on `/`, and the `t3code` Service.

## Cleanup

```bash
kubectl delete -f deployment.yaml
```
