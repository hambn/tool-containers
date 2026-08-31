# claude-code · Helm

Claude Code is Anthropic's coding agent CLI, packaged to run in a container. This page runs it on Helm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime
- `ANTHROPIC_API_KEY` set in your environment (never baked into the image)

## Files in this directory

### `chart/Chart.yaml`

```yaml
apiVersion: v2
name: claude-code
description: Claude Code CLI as a one-shot Job
type: application
version: 0.1.1
appVersion: latest
```

### `chart/templates/job.yaml`

```yaml
apiVersion: batch/v1
kind: Job
metadata:
  name: {{ .Release.Name }}-claude-code
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
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          args: {{ toJson .Values.args }}
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          env:
            - name: ANTHROPIC_API_KEY
              valueFrom:
                secretKeyRef:
                  name: {{ .Values.apiKeySecret }}
                  key: ANTHROPIC_API_KEY
          volumeMounts:
            - name: workspace
              mountPath: /workspace
      volumes:
        - name: workspace
          emptyDir: {}
```

### `chart/values.yaml`

```yaml
image:
  repository: ghcr.io/hambn/claude-code
  tag: latest
  pullPolicy: IfNotPresent

# Claude Code args.
args: ["-p", "review the workspace"]

# Name of an existing Secret holding key ANTHROPIC_API_KEY.
apiKeySecret: claude-code

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: "1"
    memory: 1Gi
```

## More examples

### Install with a custom release name

```bash
helm install claude-code ./chart
```

### Upgrade and roll back

```bash
helm upgrade claude-code ./chart --reuse-values
helm history claude-code
helm rollback claude-code 1
```

### Override values on the command line

```bash
helm upgrade claude-code ./chart --set image.tag=<tag> --set resources.limits.memory=4Gi
```

### Or with a values file

```yaml
# my-values.yaml
image:
  tag: <tag>
resources:
  limits:
    cpu: "2"
    memory: 4Gi
```

```bash
helm upgrade claude-code ./chart -f my-values.yaml
```
