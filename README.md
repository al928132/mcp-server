# Dev Notes MCP Server

A lightweight Model Context Protocol (MCP) server that lets Claude Code save, list, and read markdown notes directly from your conversations — no copy-pasting required.

## What It Does & Why It's Useful

This server gives Claude Code three tools:

| Tool | Description |
|------|-------------|
| `save_note` | Saves a titled markdown note to your notes directory |
| `list_notes` | Lists all saved notes with their last-modified dates |
| `read_note` | Reads the contents of a note by title |

Instead of manually creating and managing markdown files, you can ask Claude to save notes mid-conversation. Useful for capturing project ideas, debugging notes, meeting summaries, or any reference material you want to persist across sessions.

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- [Claude Code](https://github.com/anthropics/claude-code) CLI installed

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/al928132/mcp-server.git
   cd mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Register the server with Claude Code by adding it to your `~/.claude/claude_desktop_config.json` (or equivalent MCP config):
   ```json
   {
     "mcpServers": {
       "dev-notes-server": {
         "command": "node",
         "args": ["/path/to/mcp-server/index.js"]
       }
     }
   }
   ```

4. Restart Claude Code to load the server.

## Usage Examples

### 1. Saving a Note
> "Save a note called 'project-ideas' with ideas for my midterm project."

Claude will call `save_note` and store the content as `project-ideas.md` in your configured notes directory.

### 2. Listing All Notes
> "List all my saved notes."

Claude will call `list_notes` and return a list of all `.md` files with their last-modified dates.

### 3. Reading a Note
> "Read my 'project-ideas' note."

Claude will call `read_note` and display the full contents of `project-ideas.md`.

## Limitations & Known Issues

- **Fixed save directory:** Notes are saved to a hardcoded path (`C:\al928132\dig4503\week4\dev-notes-server`). To change it, update the `NOTES_DIR` constant in `index.js` and restart the server.
- **No subfolders:** All notes are saved flat in a single directory — there is no folder organization or tagging support.
- **Title-based lookup only:** Notes are retrieved by title slug. If two titles produce the same slug (e.g., "My Note" and "my note"), they will overwrite each other.
- **No delete tool:** There is currently no tool to delete notes — files must be removed manually.
- **Markdown only:** The server only handles `.md` files. Other file types are not supported.
