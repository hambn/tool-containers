# Docker

Run the primary browser-enabled image against the current directory:

```sh
./run.sh
AGENTBLOAT_IMAGE=ghcr.io/hambn/agentbloat:alpine ./run.sh
```

For an offline host, save `ghcr.io/hambn/agentbloat:latest` on a connected host, copy
the tar beside `airgapped.run.sh`, and run that script.
