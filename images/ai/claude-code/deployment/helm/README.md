# helm

Parameterized install of the one-shot Job.

```sh
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY=sk-...
helm install cc ./chart --set args='{-p,review the workspace}'
```

Chart publication is not enabled. Install the chart from this repository with
`helm install cc ./chart` as shown above.

Values: see [`chart/values.yaml`](./chart/values.yaml).
