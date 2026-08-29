# claude-code · Kubernetes

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Kubernetes with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

## Files in this directory

### `job.yaml`

```yaml
# One-shot Claude Code run. Create the secret first:
#   kubectl create secret generic claude-code --from-literal=ANTHROPIC_API_KEY=sk-...
apiVersion: batch/v1
kind: Job
metadata:
  name: claude-code
spec:
  backoffLimit: 0
  template:
    spec:
      restartPolicy: Never
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: claude
          image: ghcr.io/hambn/claude-code:latest
          imagePullPolicy: Always
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: "1"
              memory: 1Gi
          args: ["-p", "review the workspace"]
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: claude-code
                  key: ANTHROPIC_API_KEY
          volumeMounts:
            - name: workspace
              mountPath: /workspace
      volumes:
        - name: workspace
          emptyDir: {}
```

## More examples

### Create the API key secret first

```bash
kubectl create secret generic claude-code-auth --from-literal=ANTHROPIC_API_KEY="sk-..."


### Apply, watch, and clean up

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w
# ... later ...
kubectl delete -f deployment.yaml
