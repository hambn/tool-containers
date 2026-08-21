#!/usr/bin/env bash

set -euxo pipefail

install -m 0644 -o sysadmin -g sysadmin /tmp/zshenv /home/sysadmin/.zshenv
install -m 0644 -o sysadmin -g sysadmin /tmp/zshrc /home/sysadmin/.zshrc
install -m 0644 -o sysadmin -g sysadmin /tmp/zprofile /home/sysadmin/.zprofile
