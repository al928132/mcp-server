// =============================================================
// Dev Notes MCP Server
// =============================================================
// This is a simple Model Context Protocol (MCP) server that lets
// Claude Code save, list, and read markdown notes in ~/dev-notes/.
//
// MCP servers communicate over stdin/stdout using JSON-RPC.
// Claude Code launches this process and calls our "tools" like
// functions — each tool receives parameters and returns a result.
// =============================================================

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import os from "os";

// ------------------------------------
// Configuration
// ------------------------------------

// All notes are stored as .md files in this directory
const NOTES_DIR = "C:\\al928132\\dig4503\\week4\\dev-notes-server";

// ------------------------------------
// Helper: slugify a title into a filename
// ------------------------------------
// Converts "Project Ideas" → "project-ideas"
// Removes anything that isn't a letter, number, or space,
// then replaces spaces with hyphens.
function slugify(title) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ------------------------------------
// Helper: ensure the notes directory exists
// ------------------------------------
async function ensureNotesDir() {
  await fs.mkdir(NOTES_DIR, { recursive: true });
}

// ------------------------------------
// Create the MCP server
// ------------------------------------
// McpServer is the main class from the SDK. We give it a name
// and version so Claude Code knows what it's talking to.
const server = new McpServer({
  name: "dev-notes-server",
  version: "1.0.0",
});

// =============================================================
// Tool 1: save_note
// =============================================================
// Saves a markdown file to ~/dev-notes/ using the slugified title.
// Example: save_note("Project Ideas", "# Ideas\n- Build an app")
//   → creates ~/dev-notes/project-ideas.md
server.tool(
  "save_note",
  "Save a markdown note to ~/dev-notes/",
  {
    // Define the parameters this tool accepts using Zod schemas.
    // The SDK automatically validates inputs against these schemas.
    title: z.string().describe("The title of the note"),
    content: z.string().describe("The markdown content of the note"),
  },
  async ({ title, content }) => {
    await ensureNotesDir();

    const filename = slugify(title) + ".md";
    const filepath = path.join(NOTES_DIR, filename);

    await fs.writeFile(filepath, content, "utf-8");

    // Every tool must return an object with a `content` array.
    // Each item has a `type` (usually "text") and the data.
    return {
      content: [
        {
          type: "text",
          text: `Note saved as ${filename}`,
        },
      ],
    };
  }
);

// =============================================================
// Tool 2: list_notes
// =============================================================
// Lists all .md files in ~/dev-notes/ with their last-modified dates.
// Takes no parameters.
server.tool(
  "list_notes",
  "List all saved notes in ~/dev-notes/",
  // Empty object = no parameters
  {},
  async () => {
    await ensureNotesDir();

    const files = await fs.readdir(NOTES_DIR);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    // If no notes exist yet, return a friendly message
    if (mdFiles.length === 0) {
      return {
        content: [{ type: "text", text: "No notes found in ~/dev-notes/" }],
      };
    }

    // Build a list with title and last-modified date for each note
    const notes = await Promise.all(
      mdFiles.map(async (file) => {
        const stat = await fs.stat(path.join(NOTES_DIR, file));
        // Convert the filename back to a readable title
        const title = file.replace(".md", "").replace(/-/g, " ");
        const modified = stat.mtime.toLocaleDateString();
        return `- ${title} (${file}) — modified ${modified}`;
      })
    );

    return {
      content: [
        {
          type: "text",
          text: notes.join("\n"),
        },
      ],
    };
  }
);

// =============================================================
// Tool 3: read_note
// =============================================================
// Reads a note by title. Slugifies the title to find the file.
// Example: read_note("Project Ideas") → reads project-ideas.md
server.tool(
  "read_note",
  "Read a saved note from ~/dev-notes/",
  {
    title: z.string().describe("The title of the note to read"),
  },
  async ({ title }) => {
    await ensureNotesDir();

    const filename = slugify(title) + ".md";
    const filepath = path.join(NOTES_DIR, filename);

    try {
      const content = await fs.readFile(filepath, "utf-8");
      return {
        content: [{ type: "text", text: content }],
      };
    } catch (err) {
      // If the file doesn't exist, return an error message.
      // Setting isError: true tells Claude this tool call failed.
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Note not found: ${filename}`,
          },
        ],
      };
    }
  }
);

// =============================================================
// Start the server
// =============================================================
// StdioServerTransport connects the server to stdin/stdout,
// which is how Claude Code communicates with MCP servers.
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // The server is now running and waiting for requests from Claude Code.
  // It will keep running until the process is terminated.
}

main().catch((err) => {
  console.error("Server failed to start:", err);
  process.exit(1);
});
