# helm

Parameterized install of the Deployment + Service. Auth the agent from the T3 Code UI.

```sh
helm install t3 ./chart
kubectl port-forward svc/t3-t3code 3773:3773   # then http://localhost:3773
```

Published chart (OCI):

```sh
helm install t3 oci://ghcr.io/hambn/charts/t3code
```

Values: see [`chart/values.yaml`](./chart/values.yaml).
