# Getting started

Connect your account, fund your prepaid balance, and choose between an interactive machine and a one-shot job.

## Connect & sign in

Open [Explore](https://tendrilhq.com/explore). Connect Pera, Defly, or Lute for non-custodial use, or choose **Continue with Google** to provision a custodial Algorand wallet automatically.

Wallet sign-in proves control of your address. Session credentials let you manage its balance and contributor keys; a headless client can pay with x402 without browser sign-in.

## Top up USDC

Deposit USDC into your prepaid balance. The x402 facilitator sponsors payment network fees, and settled deposits are credited with idempotent protection.

Use USDC on the same network as the registry. [Algorand settlement basics](/docs/start/algorand-settlement) explains asset and network discovery.

## Rent & SSH or run

Pick a machine on **Explore**, start a lease, and copy the returned SSH command. See [SSH Access & Keys](/docs/guides-access/ssh-access-keys) for passwords, public keys, and host-key handling.

For a single script, submit a job to `POST /x402/run`. Tendril selects an idle machine and returns the execution result. See [One-shot jobs](/docs/guides-access/one-shot-jobs).

## Release your machine

Save your output before choosing **Release**. Billing stops when the lease closes, usage is reconciled, and the sandbox is destroyed. Sandboxes do not persist files between leases.
