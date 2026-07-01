# alpine-minimal: Claude Code native binary on bare Alpine, no Node.js runtime.
# Native installer is glibc-linked; on musl it needs libgcc/libstdc++ + system ripgrep
# (USE_BUILTIN_RIPGREP=0). See https://code.claude.com/docs/en/setup.
FROM alpine:3.21

ARG CLAUDE_CODE_VERSION=latest

# Native-binary runtime deps + tools Claude Code shells out to.
RUN apk add --no-cache ca-certificates curl bash git ripgrep libgcc libstdc++

# Non-root user (Alpine ships none at uid 1000).
RUN adduser -D -u 1000 claude
USER claude
ENV HOME=/home/claude \
    USE_BUILTIN_RIPGREP=0 \
    PATH=/home/claude/.local/bin:$PATH

# Native install to ~/.local/bin/claude. CI pins the exact version; 'latest' otherwise.
# ponytail: pins via install.sh arg, not the signed apk repo — apk repo can't pin an exact version.
RUN curl -fsSL https://claude.ai/install.sh | bash -s "${CLAUDE_CODE_VERSION}"

WORKDIR /workspace
ENTRYPOINT ["claude"]
