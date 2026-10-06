import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedRunTimeoutMs } from "@tendril/shared";
import { claimNotebookPayer, notebookPayerBusy, withRunDeadline } from "./runLimits.js";

test("payer claim rejects concurrent notebooks and releases on completion", () => {
  const release = claimNotebookPayer("test-payer")!;
  assert.equal(notebookPayerBusy("test-payer"), true);
  assert.equal(claimNotebookPayer("test-payer"), null);
  release();
  assert.equal(notebookPayerBusy("test-payer"), false);
  const nextRelease = claimNotebookPayer("test-payer")!;
  release(); // A stale completion must not release a newer request's claim.
  assert.equal(notebookPayerBusy("test-payer"), true);
  nextRelease();
});

test("run deadline is finite, rejects stalled execution, and leaves no timer on success", async () => {
  assert.equal(boundedRunTimeoutMs(Infinity), 120_000);
  assert.equal(boundedRunTimeoutMs(1e12), 900_000);
  assert.equal(await withRunDeadline(Promise.resolve("done"), 100), "done");
  await assert.rejects(withRunDeadline(new Promise(() => {}), 10), /time limit/);
});
