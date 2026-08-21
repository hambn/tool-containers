# Helm charts

Use `helm/chart/` for parameterized installs and publish charts to GHCR OCI when chart
publishing is enabled.

## Rules

- Use `Chart.yaml` with `apiVersion: v2`, a tool-matching `name`, a bumped chart `version`
  on chart changes, and an `appVersion` for the packaged tool.
- Expose `image.repository`, `image.tag`, `image.pullPolicy`, tool arguments, and the name
  of the user-created Secret in `values.yaml`.
- Consume secrets through `secretKeyRef`; never template raw credentials.
- Keep templates minimal and apply-ready. Add helpers or notes only when they solve a real
  repeated need.
- Document both `helm install <name> ./chart` and the GHCR OCI install path when published.
