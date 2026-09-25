// Lädt die optionale .env-Datei ohne Konsolenausgabe (stdout gehört beim MCP-Server dem Protokoll).
import dotenv from "dotenv";

dotenv.config({ quiet: true });
