/**
 * Default Explore filter. Run: npx tsx shared/src/runtime.test.ts
 */
import assert from "node:assert/strict";
import { listedOnDefaultExplore } from "./index.js";

assert.equal(listedOnDefaultExplore({ runtime: "microvm", kvm: true }), true);
assert.equal(listedOnDefaultExplore({ runtime: "microvm", kvm: false }), false);
assert.equal(listedOnDefaultExplore({ runtime: "docker", kvm: true }), false);
assert.equal(listedOnDefaultExplore({ runtime: "docker", kvm: false }), false);
assert.equal(listedOnDefaultExplore({ runtime: "gvisor", kvm: true }), false);
assert.equal(listedOnDefaultExplore({}), false);

console.log("default explore filter ok");
