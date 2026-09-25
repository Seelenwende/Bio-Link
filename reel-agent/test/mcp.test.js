import { test } from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("MCP-Server: Werkzeuge werden angeboten und content_guide antwortet", async () => {
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(
    new StdioClientTransport({ command: process.execPath, args: [fileURLToPath(new URL("../src/mcp.js", import.meta.url))], stderr: "ignore" }),
  );
  try {
    const { tools } = await client.listTools();
    const names = tools.map((t) => t.name);
    for (const n of ["content_guide", "create_post", "publish_post", "schedule_post", "connect_instagram", "connect_facebook"]) assert.ok(names.includes(n), n);
    const guide = await client.callTool({ name: "content_guide", arguments: {} });
    assert.match(guide.content[0].text, /Hook/);
    const { prompts } = await client.listPrompts();
    assert.ok(prompts.some((p) => p.name === "neuer_beitrag"));
    const bad = await client.callTool({ name: "publish_post", arguments: { post_id: "x" } });
    assert.equal(bad.isError, true);
  } finally {
    await client.close();
  }
});
