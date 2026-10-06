# Sandboxes & Bore Tunnels

Each lease uses a disposable Docker sandbox on a contributor machine. Renters access the sandbox rather than the contributor's host filesystem.

## Disposable execution

The contributor daemon starts a fresh Linux container for a lease or job. CPU, RAM, and PID limits bound the workload. Containers are destroyed at release; local files do not survive into the next lease.

## Outbound tunnel

A bore client inside the sandbox connects outward to the relay. The relay exposes an allocated port and forwards TCP traffic to the sandbox's SSH server. Providers do not need incoming router ports, port forwarding, or a static public IP.

SSH provides encryption end-to-end between the renter and the sandbox. The relay forwards that SSH connection.

## Connection details

The registry returns the relay host, allocated port, and lease credentials when the sandbox is ready. Use those returned values rather than assuming the same port on every lease.

See [SSH Access & Keys](/docs/guides-access/ssh-access-keys) for commands and host keys, and [Security & Sandboxes](/docs/guides-access/security-sandboxes) for isolation controls.
