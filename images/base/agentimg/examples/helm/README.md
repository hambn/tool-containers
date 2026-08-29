# agentimg · Helm

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Helm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `chart/Chart.yaml`

```yaml
apiVersion: v2
name: agentimg
description: General-purpose developer and agent foundation environment
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
    app.kubernetes.io/name: agentimg
    app.kubernetes.io/instance: {{ .Release.Name }}
spec:
  replicas: {{ .Values.replicaCount }}
  selector:
    matchLabels:
      app.kubernetes.io/name: agentimg
      app.kubernetes.io/instance: {{ .Release.Name }}
  template:
    metadata:
      labels:
        app.kubernetes.io/name: agentimg
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
        - name: agentimg
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
  repository: ghcr.io/hambn/agentimg
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
helm install agentimg ./chart


### Upgrade and roll back

```bash
helm upgrade agentimg ./chart --reuse-values
helm history agentimg
helm rollback agentimg 1


### Override values on the command line

```bash
helm upgrade agentimg ./chart --set image.tag=<tag> --set resources.limits.memory=4Gi


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
helm upgrade agentimg ./chart -f my-values.yaml
