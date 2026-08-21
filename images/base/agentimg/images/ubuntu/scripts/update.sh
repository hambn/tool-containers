#!/usr/bin/env bash

set -euxo pipefail

update() {
    rm -f /etc/dpkg/dpkg.cfg.d/excludes /etc/dpkg/dpkg.cfg.d/01_nodoc
    apt-get update
    apt-get -y -o Dpkg::Options::=--force-confold \
        -o Dpkg::Options::=--force-confdef dist-upgrade
}

update
apt-get clean
rm -rf /var/lib/apt/lists/*
