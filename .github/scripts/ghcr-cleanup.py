#!/usr/bin/env python3
"""Command-line entry point for safe GHCR version cleanup."""

from ci import entrypoint
from ghcr_cleanup import main

if __name__ == "__main__":
    entrypoint(main)
