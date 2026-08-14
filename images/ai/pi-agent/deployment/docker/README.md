# Docker

Run Pi against the current directory with the primary browser-enabled image:

```sh
./run.sh
PI_AGENT_IMAGE=ghcr.io/hambn/pi-agent:alpine ./run.sh --help
```

For an offline host, save `ghcr.io/hambn/pi-agent:latest` on a connected host, copy
the tar beside `airgapped.run.sh`, and run that script.

Pi supports provider login flows and runtime API-key environment variables. Keep those
credentials in the host environment; they are not stored in the image or script.
