/**
 * Default Explore filter. Run: npx tsx shared/src/runtime.test.ts
 */
import assert from "node:assert/strict";
import { listedOnDefaultExplore, capabilities, runtimeAdvertisement } from "./index.js";

assert.equal(listedOnDefaultExplore({ runtime: "microvm", kvm: true }), true);
assert.equal(listedOnDefaultExplore({ runtime: "microvm", kvm: false }), false);
assert.equal(listedOnDefaultExplore({ runtime: "docker", kvm: true }), false);
assert.equal(listedOnDefaultExplore({ runtime: "docker", kvm: false }), false);
assert.equal(listedOnDefaultExplore({ runtime: "gvisor", kvm: true }), false);
assert.equal(listedOnDefaultExplore({}), false);
assert.equal(capabilities().python, true);
assert.equal(capabilities({ ssh: true }).python, false);
assert.equal(capabilities().notebook, false);
assert.deepEqual(runtimeAdvertisement({ runtime: "fake", kvm: "true" }), { runtime: "docker", kvm: false, capabilities: capabilities() });

console.log("default explore filter ok");
