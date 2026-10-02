---
name: Docker command
description: Serve T3 Code on your current checkout with copyable Docker commands for localhost access, all host interfaces, or persistent application state.
usecase: Local GUI over a checkout
keywords: [web gui, port 3773, localhost, persistent state]
---

# Run T3 Code with Docker command

Serve [T3 Code](../../README.md) with the current directory mounted at `/workspace`. Choose one command for the access and storage you need.

## Prerequisites

- Docker Engine 23 or later.

## Listen on localhost

Open T3 Code at `http://127.0.0.1:3773` from the host:

```bash
docker run --rm \
  --name t3code-instance \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser
```

## Listen on all host interfaces

Publish port 3773 on all host interfaces, including `0.0.0.0`, to allow access from other machines that can reach the host:

```bash
docker run --rm \
  --name t3code-instance \
  -p 3773:3773 \
  -v "$PWD:/workspace" \
  ghcr.io/hambn/t3code:ubuntu-browser
```

## Keep application state

Run in the background with a named home volume to keep T3 Code state and agent logins across container removal:

```bash
docker run -d \
  --name t3code-instance \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  -v t3code-home:/home/sysadmin \
  ghcr.io/hambn/t3code:ubuntu-browser
```

View the server output:

```bash
docker logs t3code-instance
```

## Pair your browser

The server prints a `Token:` line. Open `http://127.0.0.1:3773/pair#token=<token>`, then add `/workspace` as a project and sign in to an agent from the UI. For access from another machine, replace `127.0.0.1` with the host address.

The token expires after five minutes. Create another pairing URL:

```bash
docker exec t3code-instance t3 auth pairing create --base-url http://127.0.0.1:3773
```

The startup pairing URL may use the container IP, so use the host address when opening it.

## Use the host Docker daemon

On Linux, mount the host socket and add its group to let agents run Docker commands. Socket access gives the container root-equivalent access to the host.

```bash
docker run --rm \
  --name t3code-instance \
  -p 127.0.0.1:3773:3773 \
  -v "$PWD:/workspace" \
  -v /var/run/docker.sock:/var/run/docker.sock \
  --group-add "$(stat -c %g /var/run/docker.sock)" \
  ghcr.io/hambn/t3code:ubuntu-browser
```

## Workspace and cleanup

T3 Code and its agents run as `sysadmin`, UID 1000. Files they create in `/workspace` belong to UID 1000 on the host. Replace the image tag with a digest to pin one build.

Run one example at a time because they share a container name and port. Stop a foreground example with Ctrl-C. Its `--rm` flag removes the container and its settings and logins; workspace files remain on the host.

Remove the background instance before starting another example:

```bash
docker rm -f t3code-instance
```

The `t3code-home` volume keeps its state until you remove it:

```bash
docker volume rm t3code-home
```
