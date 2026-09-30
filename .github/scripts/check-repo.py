#!/usr/bin/env python3
"""Check repository contracts without building, pulling, or running images."""

from ci import entrypoint
from repository_check import main

if __name__ == "__main__":
    entrypoint(main)
