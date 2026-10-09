import { expect, test } from "@playwright/test";

test("MCP setup stays usable across clients and narrow screens", async ({ page, context }) => {
  await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin: "http://127.0.0.1:5173" });
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("http://127.0.0.1:5173/explore");
  await page.getByRole("button", { name: "Toggle Navigation" }).click();
  await page.getByRole("button", { name: "Connect MCP" }).click();

  const dialog = page.getByRole("dialog", { name: "Put compute in your agent’s hands." });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole("tab", { name: "Claude Desktop" })).toHaveAttribute("aria-selected", "true");
  await expect(dialog.locator(".mcp-file")).toContainText("claude_desktop_config.json");

  await dialog.getByRole("tab", { name: "Claude Desktop" }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.getByRole("tab", { name: "Cursor" })).toHaveAttribute("aria-selected", "true");

  await dialog.getByRole("tab", { name: "VS Code" }).click();
  await expect(dialog.locator(".mcp-file")).toContainText(".vscode/mcp.json");
  await expect(dialog.locator(".mcp-codeblock pre")).toContainText('"servers"');
  await dialog.getByRole("button", { name: "Copy config" }).click();
  await expect(dialog.getByRole("button", { name: "Copied" })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toContain('"servers"');

  await dialog.getByRole("tab", { name: "Claude Code" }).click();
  await expect(dialog.locator(".mcp-codeblock pre")).toContainText("claude mcp add");
  const bounds = await dialog.evaluate((element) => element.getBoundingClientRect());
  expect(bounds.width).toBeLessThanOrEqual(375);
  expect(bounds.bottom).toBeLessThanOrEqual(812);
  expect(bounds.top).toBeGreaterThanOrEqual(0);

  await dialog.screenshot({ path: test.info().outputPath("mcp-mobile.png") });
  await page.setViewportSize({ width: 1440, height: 900 });
  await dialog.getByRole("tab", { name: "Claude Desktop" }).click();
  await dialog.screenshot({ path: test.info().outputPath("mcp-desktop.png") });

  await dialog.getByRole("button", { name: "Done" }).click();
  await expect(dialog).toHaveCount(0);
});
