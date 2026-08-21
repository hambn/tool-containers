# helm

Parameterized install of the Deployment + Service. Auth the agent from the T3 Code UI.

```sh
helm install t3 ./chart
kubectl port-forward svc/t3-t3code 3773:3773   # then http://localhost:3773
```

Chart publication is not enabled. Install the chart from this repository with
`helm install t3 ./chart` as shown above.

Values: see [`chart/values.yaml`](./chart/values.yaml).
