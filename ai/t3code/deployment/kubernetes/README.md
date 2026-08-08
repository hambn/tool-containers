# kubernetes

Raw manifests. Long-running Deployment + Service serving the T3 Code web GUI.
Auth the agent from the T3 Code UI.

```sh
kubectl apply -f deployment.yaml
kubectl port-forward svc/t3code 3773:3773   # then http://localhost:3773
```

The inherited Docker CLI does not imply a Docker daemon inside the pod, and
`systemctl restart docker` cannot work when systemd is not PID 1. If T3 Code agents need
Docker, configure `DOCKER_HOST` for a remote daemon or add an explicitly privileged
DinD sidecar after accepting the security implications.

| File | Use |
|------|-----|
| `deployment.yaml` | Deployment + ClusterIP Service on port 3773 |

For templated/parameterized installs use the [helm](../helm) chart instead.
