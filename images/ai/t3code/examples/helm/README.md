# t3code · Helm

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Helm with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `chart/Chart.yaml`

```yaml
apiVersion: v2
name: t3code
description: T3 Code web GUI for coding agents as a Deployment + Service
type: application
version: 0.1.1
appVersion: latest
```

### `chart/templates/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ .Release.Name }}-t3code
  labels: { app: {{ .Release.Name }}-t3code }
spec:
  replicas: 1
  selector:
    matchLabels: { app: {{ .Release.Name }}-t3code }
  template:
    metadata:
      labels: { app: {{ .Release.Name }}-t3code }
    spec:
      securityContext:
        runAsNonRoot: true
        runAsUser: 1000
        runAsGroup: 1000
        fsGroup: 1000
        seccompProfile:
          type: RuntimeDefault
      containers:
        - name: t3
          image: "{{ .Values.image.repository }}:{{ .Values.image.tag }}"
          imagePullPolicy: {{ .Values.image.pullPolicy }}
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            {{- toYaml .Values.resources | nindent 12 }}
          ports:
            - containerPort: 3773
          livenessProbe:
            httpGet:
              path: /
              port: 3773
            initialDelaySeconds: 15
            periodSeconds: 20
          readinessProbe:
            httpGet:
              path: /
              port: 3773
            initialDelaySeconds: 5
            periodSeconds: 10
          volumeMounts:
            - name: workspace
              mountPath: /workspace
      volumes:
        - name: workspace
          emptyDir: {}
---
apiVersion: v1
kind: Service
metadata:
  name: {{ .Release.Name }}-t3code
spec:
  selector: { app: {{ .Release.Name }}-t3code }
  ports:
    - port: {{ .Values.service.port }}
      targetPort: 3773
```

### `chart/values.yaml`

```yaml
image:
  repository: ghcr.io/hambn/t3code
  tag: ubuntu-browser
  pullPolicy: IfNotPresent

service:
  port: 3773

resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: "2"
    memory: 2Gi
```

## More examples

### Install with a custom release name

```bash
helm install t3code ./chart


### Upgrade and roll back

```bash
helm upgrade t3code ./chart --reuse-values
helm history t3code
helm rollback t3code 1


### Override values on the command line

```bash
helm upgrade t3code ./chart --set image.tag=<tag> --set resources.limits.memory=4Gi


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
helm upgrade t3code ./chart -f my-values.yaml
