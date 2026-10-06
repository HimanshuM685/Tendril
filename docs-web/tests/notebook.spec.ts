import { expect, test, type Page } from "@playwright/test";

function notebook() {
  return { nbformat: 4, nbformat_minor: 5, metadata: {}, cells: [
    { id: "first", cell_type: "code", source: "print('kept')", metadata: {}, execution_count: null, outputs: [] as Record<string, unknown>[] },
    { id: "second", cell_type: "code", source: "raise ValueError('bad input')", metadata: {}, execution_count: null, outputs: [] as Record<string, unknown>[] },
  ] };
}

async function mockApi(page: Page) {
  let polls = 0;
  await page.addInitScript(() => localStorage.setItem("tendril.session", JSON.stringify({
    token: "test-session", address: "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY5HFKQ", authType: "email",
  })));
  await page.route("**/*", async (route) => {
    const path = new URL(route.request().url()).pathname;
    let body: unknown;
    if (path === "/explorer") body = { notebooks: true, priority: true, priorityUsdPerHour: 0.1,
      nodes: [{ id: "peer", label: "Test peer", cpuCores: 2, ramMb: 2048, gpu: null,
        provider: "contributor", status: "online", pricePerHourUsd: 1, payoutBlocked: false }] };
    else if (path === "/wallet") body = { balanceAtomic: 5_000_000, earningsAtomic: 0, charges: [], topups: [] };
    else if (path === "/auth/google/prepare") body = { requestId: "request", summary: "Run notebook", details: "Test payment" };
    else if (path === "/auth/google/confirm") body = { jobId: "job", jobToken: "test-job", status: "starting" };
    else if (path === "/x402/run/job") {
      expect(route.request().headers().authorization).toBe("Bearer test-job");
      polls++;
      if (polls === 1) body = { jobId: "job", status: "ended" }; // Result not collected yet.
      else {
        const nb = notebook();
        nb.cells[0].outputs = [{ output_type: "stream", name: "stdout", text: "kept\n" }];
        nb.cells[1].outputs = [{ output_type: "error", ename: "ValueError", evalue: "bad input", traceback: ["ValueError: bad input"] }];
        body = { jobId: "job", status: "ended", error: "Cell 2: ValueError: bad input",
          run: { jobId: "job", ok: false, result: "Cell 2: ValueError: bad input", notebook: nb,
            artifacts: [{ name: "result.txt", mediaType: "text/plain", base64: "ZG9uZQ==" }],
            execution: { seconds: 3, costAtomic: "833", balance: "4999167" } } };
      }
    } else if (path === "/auth/google/gas-request") body = { request: null };
    else if (path === "/auth/google/account") body = { algoMicro: 0, usdcAtomic: 0, usdcOptedIn: true };
    else if (path.startsWith("/auth/") && path.endsWith("/enabled")) body = { enabled: true };
    else return route.continue();
    await route.fulfill({ json: body, headers: { "access-control-allow-origin": "*" } });
  });
}

test("notebook upload rejects unsupported kernels and oversized files before payment", async ({ page }) => {
  await mockApi(page);
  await page.goto("http://127.0.0.1:5173/explore");
  const section = page.locator("#run-notebook");
  const upload = section.locator('input[type="file"]');
  await expect(upload).toBeEnabled();
  await upload.setInputFiles({ name: "r.ipynb", mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ ...notebook(), metadata: { language_info: { name: "R" } } })) });
  await expect(section.locator(".notebook-error")).toHaveText("only Python notebooks are supported");
  await expect(section.getByRole("button", { name: "Run on contributor", exact: true })).toBeDisabled();
  await upload.setInputFiles({ name: "large.ipynb", mimeType: "application/json", buffer: Buffer.alloc(1_500_001) });
  await expect(section.locator(".notebook-error")).toHaveText("Notebooks must be under 1.5 MB.");
  await expect(page.getByRole("dialog", { name: "Confirm transaction" })).toHaveCount(0);
});

test("failed notebook keeps partial output, artifacts, billing, and waits for completed result", async ({ page }) => {
  await mockApi(page);
  await page.goto("http://127.0.0.1:5173/explore");
  const section = page.locator("#run-notebook");
  const upload = section.locator('input[type="file"]');
  await expect(upload).toBeEnabled();
  await upload.setInputFiles({ name: "example.ipynb", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(notebook())) });
  await section.getByRole("button", { name: "Run on contributor", exact: true }).click();
  await page.getByRole("dialog", { name: "Confirm transaction" }).getByRole("button", { name: "Approve", exact: true }).click();
  await expect(section.locator(".notebook-results-empty")).toContainText("Running the notebook");
  await expect(section.locator(".notebook-summary")).toContainText("Failed", { timeout: 15_000 });
  await expect(section.locator(".notebook-summary")).toContainText("3s billed");
  await expect(section.locator(".notebook-error")).toHaveText("Cell 2: ValueError: bad input");
  await expect(section.locator(".notebook-output").filter({ hasText: "kept" })).toHaveText("kept");
  await expect(section.locator(".notebook-artifact")).toContainText("result.txt");
  await expect(section.getByRole("button", { name: "Download notebook" })).toBeEnabled();
  expect(await section.innerText()).not.toContain("__TENDRIL_NB__");
  const download = page.waitForEvent("download");
  await section.getByRole("button", { name: "Download", exact: true }).click();
  expect((await download).suggestedFilename()).toBe("result.txt");
});
