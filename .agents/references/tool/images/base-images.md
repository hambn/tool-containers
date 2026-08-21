# Choosing a base image

Choose the base for the variant's runtime and support needs. The base is normally an
implementation detail; document it in the Dockerfile and tool README rather than making
it a variant name by itself.

| Base | Strength | Trade-off |
|------|----------|-----------|
| Debian slim | small glibc image with apt | larger than Alpine |
| Alpine | smallest common image | musl compatibility and native-module risk |
| Ubuntu | familiar, broad package set | larger footprint |
| Distroless | reduced runtime surface | no shell or package manager |

## Rules

- Default to a slim Debian base unless the tool has a reason to differ.
- Use Alpine when the tool and its native dependencies are verified on musl.
- Use Ubuntu or a fuller Debian image when the profile needs a broad development toolchain.
- Use distroless only for a runtime that does not need debugging tools or a shell.
- Pin the base version with an `ARG` where practical and let CI record its resolved digest.
- Record architecture limitations and native build assumptions in the Dockerfile and CI guide.
