# Kubernetes manifests

Use raw, apply-ready manifests for copy-paste Kubernetes deployments. Use Helm for
parameterized installs.

## Rules

- Put required credentials in a user-created Secret and consume them with `secretKeyRef`;
  document the `kubectl create secret` command.
- For one-shot jobs, use `batch/v1`, `restartPolicy: Never`, and a deliberate `backoffLimit`.
- Mount `/workspace` from an `emptyDir` for ephemeral work or a PVC when persistence is
  required.
- Use a real default image such as `ghcr.io/<owner>/<tool>:latest`; leave only documented,
  non-breaking customization points.
- Add `deployment.yaml`, `cronjob.yaml`, or another manifest only when the tool needs that
  execution shape, and document each one in the platform README.
