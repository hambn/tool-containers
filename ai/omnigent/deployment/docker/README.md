# Docker

Run Omnigent against the current directory:

```sh
./run.sh
OMNIGENT_IMAGE=ghcr.io/hambn/omnigent:alpine ./run.sh
```

For an offline host, save `ghcr.io/hambn/omnigent:latest` on a connected host, copy
the tar beside `airgapped.run.sh`, and run that script.
