import { existsSync } from "node:fs";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type { SandboxRuntime } from "@tendril/shared";
import { config } from "../config.js";
import { dockerDriver } from "./docker.js";
import { firecrackerDriver } from "./firecracker.js";
import type { RuntimeDriver } from "./types.js";

const execFileP = promisify(execFile);

/**
 * What the heartbeat may claim. No `/dev/kvm` is never a public microVM.
 * KVM without a kernel or jailer stays on Docker and is not advertised as microvm.
 */
export function advertise(opts: { kvmDevice: boolean; canBootMicrovm: boolean }): {
  runtime: SandboxRuntime;
  kvm: boolean;
} {
  if (!opts.kvmDevice) return { runtime: "docker", kvm: false };
  if (!opts.canBootMicrovm) return { runtime: "docker", kvm: true };
  return { runtime: "microvm", kvm: true };
}

async function binWorks(bin: string): Promise<boolean> {
  try {
    await execFileP(bin, ["--version"], { timeout: 5_000 });
    return true;
  } catch {
    return false;
  }
}

export async function selectDriver(): Promise<{ driver: RuntimeDriver; kvm: boolean }> {
  const kvmDevice = existsSync("/dev/kvm");
  const kernelOk = config.guestKernel.length > 0 && existsSync(config.guestKernel);
  const canBoot = kvmDevice && kernelOk && (await binWorks(config.jailerBin)) && (await binWorks(config.firecrackerBin));
  const advertised = advertise({ kvmDevice, canBootMicrovm: canBoot });
  if (advertised.runtime === "microvm") {
    return {
      driver: firecrackerDriver({
        kernelPath: config.guestKernel,
        jailerBin: config.jailerBin,
        firecrackerBin: config.firecrackerBin,
        stateDir: config.stateDir,
      }),
      kvm: true,
    };
  }
  return { driver: dockerDriver(), kvm: advertised.kvm };
}
