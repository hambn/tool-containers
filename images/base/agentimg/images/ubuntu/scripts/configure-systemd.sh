#!/usr/bin/env bash

set -euxo pipefail

configure_systemd() {
    # Systemd container profile

    install -d /etc/systemd/system.conf.d /etc/systemd/journald.conf.d /etc/tmpfiles.d
    install -m 0644 /tmp/agentimg-systemd-container.conf \
        /etc/systemd/system.conf.d/agentimg-container.conf
    install -m 0644 /tmp/agentimg-journald-container.conf \
        /etc/systemd/journald.conf.d/agentimg-container.conf
    install -m 0644 /tmp/agentimg-tmpfiles-tmp.conf /etc/tmpfiles.d/tmp.conf

    systemctl set-default multi-user.target
    systemctl mask -- \
        apt-daily.service apt-daily.timer apt-daily-upgrade.service apt-daily-upgrade.timer \
        atop-rotate.timer console-getty.service dm-event.socket dpkg-db-backup.timer \
        e2scrub_all.timer etc-hostname.mount etc-hosts.mount etc-resolv.conf.mount fwupd.service \
        fwupd-refresh.service fwupd-refresh.timer getty.target getty@.service iscsid.socket \
        keyboard-setup.service ldconfig.service lxd-installer.socket man-db.timer \
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
        systemd-udevd-kernel.socket systemd-udevd.service update-notifier-download.timer \
        update-notifier-motd.timer ubuntu-fan.service unattended-upgrades.service -.mount
    systemctl disable -- \
        apport-autoreport.path apport-autoreport.timer apport-forward.socket apport.service \
        atop.service atopacct.service containerd.service docker.service e2scrub_reap.service \
        lvm2-lvmpolld.socket multipathd.service nginx.service snapd.service snapd.socket \
        ssh.service ssh.socket sysstat.service tailscaled.service udisks2.service ufw.service \
        || true
}

configure_systemd
