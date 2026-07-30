# Docker

Review the current directory with the primary browser-enabled image:

```sh
./run.sh review
OCR_IMAGE=ghcr.io/hambn/open-code-review:alpine ./run.sh review
```

For an offline host, save `ghcr.io/hambn/open-code-review:latest` on a connected host,
copy the tar beside `airgapped.run.sh`, and run that script.
