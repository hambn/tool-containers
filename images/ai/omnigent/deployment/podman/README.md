# Podman

Run Omnigent rootlessly against the current directory:

```sh
./run.sh
OMNIGENT_IMAGE=ghcr.io/hambn/omnigent:alpine ./run.sh
```

The `:Z` mount option supports SELinux hosts. Credentials remain runtime
configuration and are not stored in the image or this repository.
