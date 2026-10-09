import { expect, test } from "@playwright/test";

const routes = [
  "/", "/docs/build", "/docs/build/mcp", "/docs/api", "/docs/api/x402",
  "/docs/start/getting-started", "/docs/start/architecture-flow", "/docs/start/algorand-settlement",
  "/docs/concepts/algorand-settlement", "/docs/concepts/usdc-with-x402",
  "/docs/concepts/sandboxes-bore-tunnels", "/docs/concepts/per-second-metering",
  "/docs/guides-access/ssh-access-keys", "/docs/guides-access/one-shot-jobs",
  "/docs/guides-access/security-sandboxes",
];

test("every page loads directly with its own content, unique headings, and valid TOC", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const route of routes) {
    await page.goto(route);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("#docs-sidebar [aria-current=page]")).toHaveAttribute("href", route);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `https://docs.tendrilhq.com${route}`);
    await expect(page.locator(".docs-markdown-body h2").first()).toBeVisible();
    const audit = await page.evaluate(() => {
      const ids = [...document.querySelectorAll("[id]")].map((element) => element.id);
      const missing = [...document.querySelectorAll<HTMLAnchorElement>('.docs-toc-rail a, .docs-markdown-body a[href^="#"]')].filter((anchor) => !document.getElementById(decodeURIComponent(new URL(anchor.href).hash.slice(1))));
      return { duplicates: ids.filter((id, index) => ids.indexOf(id) !== index), missing: missing.length };
    });
    expect(audit).toEqual({ duplicates: [], missing: 0 });
    if (route !== "/docs/start/architecture-flow") await expect(page.locator(".arch-svg")).toHaveCount(0);
  }
  await page.goto("/docs/start/architecture-flow");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Architecture & Flow");
  await page.goto("/docs/not-a-page");
  await expect(page.locator("h1")).toHaveText("Page not found");
});

test("anchors, page changes, and browser history select the correct document", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/docs/start/architecture-flow#request-flow");
  await expect(page.locator("#request-flow")).toBeInViewport();
  await page.locator(".docs-toc-rail").getByRole("link", { name: "Machine Lifecycle", exact: true }).click();
  await expect(page).toHaveURL(/architecture-flow#machine-lifecycle$/);
  await expect(page.locator("#machine-lifecycle")).toBeInViewport();
  const offset = await page.locator("#machine-lifecycle").evaluate((element) => element.getBoundingClientRect().top);
  expect(offset).toBeGreaterThanOrEqual(110);
  await page.locator("#docs-sidebar").getByRole("link", { name: "Per-Second Metering", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("Per-Second Metering");
  await expect(page.locator("#request-flow")).toHaveCount(0);
  await page.goBack();
  await expect(page).toHaveURL(/architecture-flow#machine-lifecycle$/);
  await expect(page.locator("#machine-lifecycle")).toBeInViewport();
  await page.goBack();
  await expect(page).toHaveURL(/architecture-flow#request-flow$/);
  await page.goForward();
  await expect(page).toHaveURL(/architecture-flow#machine-lifecycle$/);
});

test("legacy URLs and Markdown cross-references resolve to dedicated routes", async ({ page }) => {
  const legacy = [
    ["/docs", "/"],
    ["/docs/", "/"],
    ["/?tab=build#daemon-install", "/docs/build#daemon-install"],
    ["/?doc=x402#post-x402run", "/docs/api/x402#post-x402run"],
    ["/#architecture", "/docs/start/architecture-flow"],
    ["/api#get-explorer", "/docs/api#get-explorer"],
    ["/docs?tab=build#daemon-install", "/docs/build#daemon-install"],
    ["/docs?doc=x402#post-x402run", "/docs/api/x402#post-x402run"],
    ["/docs?doc=mcp#clients", "/docs/build/mcp#clients"],
    ["/docs#architecture", "/docs/start/architecture-flow"],
    ["/docs#ssh-access", "/docs/guides-access/ssh-access-keys"],
  ];
  for (const [oldPath, newPath] of legacy) {
    await page.goto(oldPath);
    await expect(page).toHaveURL(`http://127.0.0.1:5175${newPath}`);
  }
  await page.goto("/docs/api");
  await page.locator(".docs-markdown-body").getByRole("link", { name: "x402-api.md", exact: true }).first().click();
  await expect(page).toHaveURL(/\/docs\/api\/x402$/);
  await expect(page.locator("h1")).toHaveText("x402 Payments");
});

test("mobile search, page menu, and TOC remain usable", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/docs");
  const search = page.getByRole("combobox", { name: "Search documentation" });
  await expect(search).toBeVisible();
  await search.fill("Request Flow");
  await search.press("Enter");
  await expect(page).toHaveURL(/architecture-flow#request-flow$/);
  await expect(page.locator("#request-flow")).toBeInViewport();
  await page.getByRole("button", { name: "Browse docs", exact: true }).click();
  await page.locator("#docs-sidebar").getByRole("link", { name: "SSH Access & Keys", exact: true }).click();
  await expect(page.locator("h1")).toHaveText("SSH Access & Keys");
  await expect(page.locator("#docs-sidebar")).not.toBeVisible();
  await page.locator(".docs-mobile-toc summary").click();
  await page.locator(".docs-mobile-toc").getByRole("link", { name: "Host keys", exact: true }).click();
  await expect(page).toHaveURL(/ssh-access-keys#host-keys$/);
  await expect(page.locator("#host-keys")).toBeInViewport();
  await expect(page.locator(".docs-mobile-toc")).not.toHaveAttribute("open", "");
  await search.fill("not-a-real-topic");
  await expect(page.getByRole("status").filter({ hasText: "No results" })).toBeVisible();
  await search.press("Escape");
  await expect(page.getByRole("listbox")).not.toBeVisible();
});

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`layout stays contained and diagram preserves readable nodes at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    for (const route of ["/docs", "/docs/build", "/docs/api", "/docs/api/x402", "/docs/start/architecture-flow"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    }
    const svg = page.locator(".arch-svg");
    await expect(svg.locator("[data-node]")).toHaveCount(6);
    await expect(svg.locator("[data-edge]")).toHaveCount(6);
    const outsideNodes = await svg.locator(".arch-node").evaluateAll((elements) => elements.flatMap((element) => {
      const rect = element.querySelector("rect")!;
      const width = Number(rect.getAttribute("width"));
      return [...element.querySelectorAll<SVGTextElement>("text")].filter((text) => text.getBBox().x + text.getBBox().width > width - 8).map((text) => text.textContent);
    }));
    expect(outsideNodes).toEqual([]);
    await page.getByRole("button", { name: "USDC settlement", exact: true }).click();
    await expect(svg.locator("[data-edge=ssh]")).toHaveClass(/dimmed/);
    await expect(svg.locator("[data-edge=settle]")).not.toHaveClass(/dimmed/);
    if (width === 1440) {
      await page.evaluate(() => window.scrollTo({ top: 1100, behavior: "instant" }));
      const rails = await page.locator(".docs-sidebar-nav, .docs-toc-rail").evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().top));
      expect(rails.every((top) => top >= 110 && top <= 140)).toBe(true);
    }
    if (width === 375 || width === 1440) {
      await page.getByRole("button", { name: "All flows", exact: true }).click();
      await page.locator(".docs-arch-wrap").screenshot({ path: test.info().outputPath(`diagram-${width}.png`) });
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
      await page.screenshot({ path: test.info().outputPath(`docs-${width}.png`) });
    }
  });
}

test("both apps use the correct domain for documentation and marketplace links", async ({ page }) => {
  await page.goto("/docs");
  await expect(page.getByRole("link", { name: "Tendril home" })).toHaveAttribute("href", "https://tendrilhq.com");
  await expect(page.getByRole("link", { name: "Launch App" })).toHaveAttribute("href", "https://tendrilhq.com/explore");
  await page.goto("http://127.0.0.1:5173/");
  await expect(page.locator(".desktop-nav").getByRole("link", { name: "Docs", exact: true })).toHaveAttribute("href", "https://docs.tendrilhq.com");
  await expect(page.locator(".sidebar-footer-links").getByRole("link", { name: "CLI & Docs", exact: true })).toHaveAttribute("href", "https://docs.tendrilhq.com");
  await expect(page.getByRole("link", { name: "Run Script (/run)", exact: true })).toHaveAttribute("href", "https://docs.tendrilhq.com/docs/guides-access/one-shot-jobs");
  const broken = await page.locator("a").evaluateAll((elements) => elements.filter((element) => element.getAttribute("href")?.startsWith("/docs")).map((element) => element.textContent));
  expect(broken).toEqual([]);
  await page.goto("http://127.0.0.1:5173/explore");
  await expect(page.getByRole("link", { name: "CLI & Docs", exact: true }).first()).toHaveAttribute("href", "https://docs.tendrilhq.com");
  // Intercept external navigation so this check never depends on the live Docs deployment.
  await page.route("https://docs.tendrilhq.com/**", (route) => route.fulfill({ body: "Docs redirect reached" }));
  for (const [legacy, destination] of [
    ["/docs", "https://docs.tendrilhq.com/"],
    ["/docs/?doc=mcp#clients", "https://docs.tendrilhq.com/?doc=mcp#clients"],
    ["/docs?tab=build#daemon-install", "https://docs.tendrilhq.com/?tab=build#daemon-install"],
    ["/docs/start/architecture-flow#request-flow", "https://docs.tendrilhq.com/docs/start/architecture-flow#request-flow"],
    ["/api#get-explorer", "https://docs.tendrilhq.com/docs/api#get-explorer"],
  ]) {
    await page.goto(`http://127.0.0.1:5173${legacy}`);
    await expect(page).toHaveURL(destination);
  }
});
