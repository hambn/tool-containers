#!/usr/bin/env bash
# Opt-in systemd profile for Ubuntu: boot to multi-user.target as PID 1 in a
# privileged container without hardware, getty, update, or host-network units.
set -euo pipefail

systemctl set-default multi-user.target
systemctl mask -- \
    -.mount apt-daily.service apt-daily.timer apt-daily-upgrade.service apt-daily-upgrade.timer \
    atop-rotate.timer console-getty.service dm-event.socket dpkg-db-backup.timer \
    e2scrub_all.timer etc-hostname.mount etc-hosts.mount etc-resolv.conf.mount \
    fwupd.service fwupd-refresh.service fwupd-refresh.timer getty.target getty@.service \
    iscsid.socket keyboard-setup.service ldconfig.service lxd-installer.socket man-db.timer \
    modprobe@.service motd-news.service motd-news.timer \
    plymouth-halt.service plymouth-kexec.service plymouth-poweroff.service \
    plymouth-quit-wait.service plymouth-quit.service plymouth-read-write.service \
    plymouth-reboot.service plymouth-start.service plymouth-switch-root-initramfs.service \
    plymouth-switch-root.service systemd-ask-password-console.path \
    systemd-ask-password-wall.path systemd-hwdb-update.service \
    systemd-journal-catalog-update.service systemd-modules-load.service \
    systemd-random-seed.service systemd-remount-fs.service systemd-resolved.service \
    systemd-update-done.service systemd-update-utmp.service \
    systemd-udev-settle.service systemd-udev-trigger.service systemd-udevd-control.socket \
    systemd-udevd-kernel.socket systemd-udevd.service unattended-upgrades.service \
    update-notifier-download.timer update-notifier-motd.timer
# Daemons stay installed but off; some units may not exist.
systemctl disable -- \
    atop.service atopacct.service containerd.service docker.service docker.socket \
    e2scrub_reap.service nginx.service ssh.service ssh.socket || true

install -d /var/lib/systemd/linger
touch /var/lib/systemd/linger/sysadmin
