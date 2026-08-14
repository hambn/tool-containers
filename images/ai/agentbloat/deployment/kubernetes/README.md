# Kubernetes

Create a long-lived development pod with an ephemeral `/workspace`:

```sh
kubectl apply -f deployment.yaml
kubectl exec -it deployment/agentbloat -- zsh -l
```

Replace `emptyDir` with a PVC for persistent work. Change the image tag to select a
different variant.

The inherited Docker CLI needs an external daemon. `systemctl restart docker` cannot
work in this pod because systemd is not PID 1. Configure `DOCKER_HOST` for a remote
daemon or add an explicitly privileged DinD sidecar only when that security tradeoff is
acceptable.
