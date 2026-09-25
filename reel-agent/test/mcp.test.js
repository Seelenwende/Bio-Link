import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP-Server: Werkzeuge werden angeboten und reel_guide antwortet", async () => {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL("../src/mcp.js", import.meta.url))], stderr: "ignore" }),
  );
  try {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ["reel_guide", "create_reel", "publish_reel", "schedule_reel", "connect_instagram"]) assert.ok(names.includes(n), n);
    const guide = await client.callTool({ name: "reel_guide", arguments: {} });
    assert.match(guide.content[0].text, /Hook/);
    const { prompts } = await client.listPrompts();
    assert.ok(prompts.some((p) => p.name === "neues_reel"));
    const bad = await client.callTool({ name: "publish_reel", arguments: { reel_id: "x" } });
    assert.equal(bad.isError, true);
  } finally {
    await client.close();
  }
});
