# t3code · Kubernetes

T3 Code is a web GUI for coding agents, served from a container on port 3773. This page runs it on Kubernetes with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `deployment.yaml`

```yaml
# T3 Code web GUI as a long-running Deployment + Service. Auth the agent from the T3 Code UI.
# Reach it: kubectl port-forward svc/t3code 3773:3773  → http://localhost:3773
apiVersion: apps/v1
kind: Deployment
metadata:
  name: t3code
  labels: { app: t3code }
spec:
  replicas: 1
  selector:
    matchLabels: { app: t3code }
  template:
    metadata:
      labels: { app: t3code }
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
          image: ghcr.io/hambn/t3code:ubuntu-browser
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 100m
              memory: 256Mi
            limits:
              cpu: "2"
              memory: 2Gi
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
  name: t3code
spec:
  selector: { app: t3code }
  ports:
    - port: 3773
      targetPort: 3773
```

## More examples

### Reach the web UI

```bash
kubectl port-forward deploy/t3code 3773:3773
# then open http://localhost:3773


### Apply, watch, and clean up

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w
# ... later ...
kubectl delete -f deployment.yaml
