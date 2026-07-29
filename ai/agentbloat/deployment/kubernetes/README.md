# Kubernetes

Create a long-lived development pod with an ephemeral `/workspace`:

```sh
kubectl apply -f deployment.yaml
kubectl exec -it deployment/agentbloat -- bash
```

Replace `emptyDir` with a PVC for persistent work. Change the image tag to select a
different variant.
