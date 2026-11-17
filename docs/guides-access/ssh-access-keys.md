# SSH Access & Keys

When a lease is ready, the registry returns its relay host and unique port. Use that lease's connection details to reach the sandbox.

## Connect to your sandbox

Copy the SSH command from your active lease. For example:

```bash
ssh -i ~/.ssh/id_ed25519 tendril@bore.tendrilhq.com -p 38472
# Uses the private key matching the public key on your profile. No password.
```

The host and port above are illustrative. Always use the values returned for your lease.

## Use a public key

Save your SSH **public** key on your profile, or send it as `sshPubKey` when you rent. Keep the private key on your own machine. Tendril never asks for it.

```bash
ssh -i ~/.ssh/id_ed25519 tendril@<lease-host> -p <lease-port>
```

## Who you are inside

You log in as `tendril`, an unprivileged user, not root. The root filesystem is read-only; `/work` (your home) and `/tmp` are writable, RAM-backed, and size-capped. They share the sandbox's memory limit with your processes, so a large dataset on disk leaves less RAM for compute. `pip install` into the venv at `/work/.venv` works; `apt install` and anything needing root does not.

## Host keys

Sandboxes are ephemeral and relay ports may be reused. If SSH reports a changed host key, verify the current lease's endpoint and host-key information before updating your local known-hosts entry. Do not disable host-key verification globally.

## Save work & release

Download outputs before releasing the lease. Release destroys the container and stops its meter. See [Security & Sandboxes](/docs/guides-access/security-sandboxes) for isolation and persistence limits.
