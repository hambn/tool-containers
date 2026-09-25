# Kubernetes manifests

Use raw apply-ready manifests for simple copy-paste deployments; use Helm when users need
parameterization or repeated releases.

- Consume user-created Secrets with `secretKeyRef` or mounted secret volumes. Document
  the `kubectl create secret` command without including real values.
- Match the controller to execution: one-shot CLIs use `batch/v1` Job with
  `restartPolicy: Never` and a deliberate `backoffLimit`; only services (t3code,
  omnigent) use a Deployment.
- Mount `/workspace` from `emptyDir` for ephemeral work or a PVC for deliberately
  persistent work. State which data survives pod replacement.
- Use a real default `ghcr.io/hambn/<tool>:<variant>` and declare `imagePullPolicy`
  explicitly instead of relying on the `:latest` default. A pull policy cannot make a
  moving tag reproducible; pin an immutable version tag or digest when a workload must
  keep running one exact image.
- Set non-root security context, dropped capabilities, resource requests/limits, and
  service account behavior compatible with the image. Do not add cluster-wide RBAC when
  the tool does not require it.
- Add `deployment.yaml`, `job.yaml`, `cronjob.yaml`, Service, or Ingress only when the
  execution model needs it, and document every manifest.

Parse the YAML, run client-side or server-side dry-run where available, and inspect the
rendered image, command, secret, security, workspace, and resource contracts. State when
cluster admission or runtime testing was unavailable.
