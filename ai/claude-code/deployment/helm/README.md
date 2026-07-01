# helm

Parameterized install of the one-shot Job.

```sh
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY=sk-...
helm install cc ./chart --set args='{-p,review the workspace}'
```

Published chart (OCI):

```sh
helm install cc oci://ghcr.io/hambn/charts/claude-code
```

Values: see [`chart/values.yaml`](./chart/values.yaml).
