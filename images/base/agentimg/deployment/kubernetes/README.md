# Kubernetes

Create a long-lived development pod with an ephemeral `/workspace`:

```sh
kubectl apply -f deployment.yaml
kubectl exec -it deployment/agentimg -- zsh -l
```

Replace the `emptyDir` with a PVC for persistent work. Change the image tag to select a
different variant.

The image verifies the Docker CLI, Buildx, and Compose, but this pod does not contain a
Docker daemon. `systemctl restart docker` cannot work because systemd is not PID 1.
Provide a remote daemon through `DOCKER_HOST` or an explicitly privileged DinD sidecar
when nested containers are required; both grant powerful host or pod capabilities and
should remain opt-in.
