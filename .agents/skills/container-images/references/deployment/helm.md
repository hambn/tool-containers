# Helm charts

Use `examples/helm/chart/` for a parameterized Kubernetes install.

- `Chart.yaml` uses `apiVersion: v2`, a tool-matching `name`, a chart `version` bumped for
  chart changes, and an `appVersion` representing the packaged tool when meaningful.
- `values.yaml` exposes `image.repository`, `image.tag`, `image.pullPolicy`, tool
  arguments, workspace/storage choices, resources, security context, and the name of a
  user-created Secret only when those are genuine configuration surfaces.
- Templates consume credentials through `secretKeyRef` or secret volumes; never template
  raw credentials into manifests.
- Keep templates minimal and apply-ready. Add helpers, notes, RBAC, Service, or Ingress
  only for a concrete repeated need.
- Keep raw Kubernetes and Helm defaults consistent where they describe the same runtime.
- Document `helm install <release> ./chart`. Mention the GHCR OCI chart path only after
  chart publication is actually enabled.

Run `helm lint <chart>` and `helm template <release> <chart>` with representative values.
Inspect rendered images, commands, secrets, security contexts, workspace mounts, and
resources; bump the chart version when behavior changes.
