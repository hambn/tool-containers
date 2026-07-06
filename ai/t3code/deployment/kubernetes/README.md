# kubernetes

Raw manifests. Long-running Deployment + Service serving the T3 Code web GUI.

```sh
kubectl create secret generic t3code --from-literal=ANTHROPIC_API_KEY=sk-...
kubectl apply -f deployment.yaml
kubectl port-forward svc/t3code 3773:3773   # then http://localhost:3773
```

| File | Use |
|------|-----|
| `deployment.yaml` | Deployment + ClusterIP Service on port 3773 |

For templated/parameterized installs use the [helm](../helm) chart instead.
