# Kubernetes manifests

Use raw apply-ready manifests for simple copy-paste deployments; use Helm when users need
parameterization or repeated releases.

- Consume user-created Secrets with `secretKeyRef` or mounted secret volumes. Document
  the `kubectl create secret` command without including real values.
- Choose the workload controller that matches execution. For one-shot agents use
  `batch/v1` Job, `restartPolicy: Never`, and a deliberate `backoffLimit`; use Deployment
  only for an actual long-running service.
- Mount `/workspace` from `emptyDir` for ephemeral work or a PVC for deliberately
  persistent work. State which data survives pod replacement.
- Use a real default `ghcr.io/<owner>/<tool>:<tag>` and set an intentional pull policy.
- Set non-root security context, dropped capabilities, resource requests/limits, and
  service account behavior compatible with the image. Do not add cluster-wide RBAC when
  the tool does not require it.
- Add `deployment.yaml`, `job.yaml`, `cronjob.yaml`, Service, or Ingress only when the
  execution model needs it, and document every manifest.

Parse the YAML, run client-side or server-side dry-run where available, and inspect the
rendered image, command, secret, security, workspace, and resource contracts. State when
cluster admission or runtime testing was unavailable.
