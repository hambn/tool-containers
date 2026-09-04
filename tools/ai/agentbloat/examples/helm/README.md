# agentbloat · Helm

agentbloat bundles the current Codex, Claude Code, Cursor, Grok, OpenCode, Copilot, Gemini, ACP Registry, and Pi coding-agent CLIs in one image. This page runs it on Helm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `chart/Chart.yaml`

```yaml
apiVersion: v2
name: agentbloat
description: Current AI coding agent CLIs on agentimg foundation images
type: application
version: 0.1.1
appVersion: "ubuntu-browser"
```

### `chart/templates/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}
  labels:
    app.kubernetes.io/name: agentbloat
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/name: agentbloat
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: agentbloat
        app.kubernetes.io/instance: {{ .Release.Name }}
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: agentbloat
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          command: {{ .Values.command | toJson }}
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
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
  repository: ghcr.io/hambn/agentbloat
  tag: latest
  pullPolicy: Always

replicaCount: 1
command: ["sleep", "infinity"]

resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: "2"
    memory: 4Gi
```

## More examples

### Install with a custom release name

```bash
helm install agentbloat ./chart
```

### Upgrade and roll back

```bash
helm upgrade agentbloat ./chart --reuse-values
helm history agentbloat
helm rollback agentbloat 1
```

### Override values on the command line

```bash
helm upgrade agentbloat ./chart --set image.tag=<tag> --set resources.limits.memory=4Gi
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
helm upgrade agentbloat ./chart -f my-values.yaml
```
