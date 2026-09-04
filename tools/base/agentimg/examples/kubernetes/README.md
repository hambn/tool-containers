# agentimg · Kubernetes

agentimg is the base image family (Ubuntu and Alpine, with optional headless Chromium) the tool images build on. This page runs it on Kubernetes with copy-paste examples; every file in this directory is shown below exactly as it exists in the repository.

See the [tool overview](../../README.md) for image variants, tags, and registries.

## Requirements

- Docker or a compatible runtime

## Files in this directory

### `deployment.yaml`

```yaml
# kubectl apply -f deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agentimg
spec:
  replicas: 1
  selector:
    matchLabels:
      app: agentimg
  template:
    metadata:
      labels:
        app: agentimg
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
          image: ghcr.io/hambn/agentimg:latest
          imagePullPolicy: Always
          command: ["sleep", "infinity"]
          securityContext:
            allowPrivilegeEscalation: false
            capabilities:
              drop: ["ALL"]
          resources:
            requests:
              cpu: 250m
              memory: 512Mi
            limits:
              cpu: "2"
              memory: 4Gi
          volumeMounts:
            - name: workspace
              mountPath: /workspace
      volumes:
        - name: workspace
          emptyDir: {}
```

## More examples

### Apply, watch, and clean up

```bash
kubectl apply -f deployment.yaml
kubectl get pods -w
# ... later ...
kubectl delete -f deployment.yaml
```
