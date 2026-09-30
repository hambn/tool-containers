#!/usr/bin/env python3
"""Command-line entry point for Docker Hub README preparation."""

from ci import entrypoint
from hub_readme import main

if __name__ == "__main__":
    entrypoint(main)
