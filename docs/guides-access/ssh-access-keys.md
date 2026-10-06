# SSH Access & Keys

When a lease is ready, the registry returns its relay host and unique port. Use that lease's connection details to reach the sandbox.

## Connect to your sandbox

Copy the SSH command from your active lease. For example:

```bash
ssh root@bore.tendrilhq.com -p 38472
# Password: your wallet address, unless you supplied an SSH public key
```

The host and port above are illustrative. Always use the values returned for your lease.

## Use a public key

Supply your SSH **public** key during checkout to enable key-based authentication. Keep the private key on your own client machine.

```bash
ssh -i ~/.ssh/id_ed25519 root@<lease-host> -p <lease-port>
```

## Host keys

Sandboxes are ephemeral and relay ports may be reused. If SSH reports a changed host key, verify the current lease's endpoint and host-key information before updating your local known-hosts entry. Do not disable host-key verification globally.

## Save work & release

Download outputs before releasing the lease. Release destroys the container and stops its meter. See [Security & Sandboxes](/docs/guides-access/security-sandboxes) for isolation and persistence limits.
