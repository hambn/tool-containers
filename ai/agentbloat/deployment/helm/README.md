# Helm

Install the local chart:

```sh
helm install agentbloat ./chart
kubectl exec -it deployment/agentbloat -- bash
```

Select another variant with `--set image.tag=alpine`. Chart publication is not enabled;
when it is, the intended OCI path is `oci://ghcr.io/hambn/charts/agentbloat`.
