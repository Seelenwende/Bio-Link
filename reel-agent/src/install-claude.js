// Trägt den Social-Media-Agenten als MCP-Server in Claude Desktop ein.
// Aufruf: node src/install-claude.js   (oder Doppelklick auf „Mit Claude verbinden“)

import { readFile, writeFile, mkdir, copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import os from "node:os";
import path from "node:path";

const home = os.homedir();
const configDir =
  process.platform === "win32"
    ? path.join(process.env.APPDATA || path.join(home, "AppData", "Roaming"), "Claude")
    : process.platform === "darwin"
      ? path.join(home, "Library", "Application Support", "Claude")
      : path.join(process.env.XDG_CONFIG_HOME || path.join(home, ".config"), "Claude");
const configFile = path.join(configDir, "claude_desktop_config.json");
const serverFile = fileURLToPath(new URL("./mcp.js", import.meta.url));

let config = {};
try {
  config = JSON.parse(await readFile(configFile, "utf8"));
  await copyFile(configFile, `${configFile}.backup`);
} catch (e) {
  if (e.code !== "ENOENT") {
    console.error(`Die Claude-Konfiguration konnte nicht gelesen werden (${configFile}): ${e.message}`);
    process.exit(1);
  }
}

config.mcpServers ??= {};
// Eintrag unter altem Namen ersetzen
if (config.mcpServers["reel-agent"]?.args?.[0] === serverFile) delete config.mcpServers["reel-agent"];
// Absoluter Node-Pfad, damit Claude Desktop Node auch ohne PATH-Einstellungen findet
config.mcpServers["seelenwende-agent"] = { command: process.execPath, args: [serverFile] };

await mkdir(configDir, { recursive: true });
await writeFile(configFile, JSON.stringify(config, null, 2));

console.log(`✅ Social-Media-Agent in Claude Desktop eingetragen:\n   ${configFile}\n`);
console.log("Nächste Schritte:");
console.log("  1. Claude Desktop komplett beenden und neu starten.");
console.log("  2. In einem neuen Chat schreiben: „Mach mir ein Karussell über …“ oder „… ein Reel über …“");
console.log("     (oder über das ➕-Menü die Vorlage „Neuer Beitrag“ wählen).");
console.log("  3. Zum Posten einmalig sagen: „Verbinde Instagram mit diesem Token: …“ bzw. „Verbinde meine Facebook-Seite: …“");
