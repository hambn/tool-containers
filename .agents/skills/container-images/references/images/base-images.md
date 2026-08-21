# Choosing base images

Choose a base for the profile's verified runtime, architecture, and support needs. The
base is normally an implementation detail documented in the Dockerfile and tool README.

| Base | Strength | Trade-off |
|---|---|---|
| Debian slim | compact glibc environment with apt | larger than Alpine |
| Alpine | very small common base | musl and native-module compatibility risk |
| Ubuntu | familiar broad package set | larger runtime surface |
| Distroless | reduced runtime surface | no shell or package manager for interactive tools |

- Default to a slim Debian base for a new standalone runtime unless evidence favors an
  existing repository foundation or another base.
- Use Alpine only after verifying the tool and native dependencies on musl.
- Use Ubuntu or fuller Debian when the profile intentionally needs a development
  toolchain or broad system packages.
- Use distroless only when the runtime needs neither shell nor debugging tools; it is
  generally unsuitable for interactive coding-agent images.
- Expose a visible global base `ARG` and let CI resolve the final reference to a digest.
  Direct or air-gapped build entrypoints should have a usable, immutable default when
  the repository maintains one.
- Record and test architecture limitations. A successful amd64 build does not prove
  arm64 support.
