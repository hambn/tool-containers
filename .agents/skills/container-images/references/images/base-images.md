# Base images

Choose a base for the tested runtime and architecture. Minimal bases use Alpine 3.21 or Ubuntu 24.04. Alpine is small but musl can break native modules; Ubuntu supports the current agent toolchain. Do not infer agent support from a foundation build.

External bases are global Dockerfile arguments resolved to digests by the publisher. Internal dependencies are in `.github/image-catalog.json` and passed by digest after staged builds. Agents inherit neutral workspace core, while full workspace decoration stays separate. Browser payloads belong only to tested browser profiles. Publish linux/amd64 until native arm64 tests cover packages and browsers.
