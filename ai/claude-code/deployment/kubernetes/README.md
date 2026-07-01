# kubernetes

Raw manifests. One-shot Job that runs Claude Code against an empty workspace.

```sh
kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY=sk-...
kubectl apply -f job.yaml
```

| File | Use |
|------|-----|
| `job.yaml` | one-shot run via batch/v1 Job |

Edit `args` in `job.yaml` to change the prompt. For templated/parameterized installs use the [helm](../helm) chart instead.
