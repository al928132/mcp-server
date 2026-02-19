# Process Reflection — Dev Notes MCP Server

## 1. What I Built

I built a **Dev Notes MCP Server** — a small Node.js server that implements the Model Context Protocol (MCP) to give Claude Code the ability to save, list, and read markdown notes during a conversation.

The server exposes three tools: `save_note`, `list_notes`, and `read_note`. Each tool operates on a local directory of `.md` files, letting Claude persist information across conversations without the user needing to manually create or manage files.

**Key design decisions:**
- **Markdown format:** Notes are stored as plain `.md` files, making them human-readable and editable outside of Claude Code.
- **Slug-based filenames:** Note titles are converted to lowercase hyphenated slugs (e.g., "Project Ideas" → `project-ideas.md`), keeping filenames clean and predictable.
- **Stdio transport:** The server communicates over stdin/stdout using JSON-RPC, which is the standard MCP transport for local servers. This keeps the setup simple — no HTTP server or port management needed.
- **Single directory:** All notes live in one flat directory for simplicity. This trades organization for ease of implementation.

---

## 2. How Claude Code Helped

Claude Code was useful throughout this project for tasks that were tedious or easy to get wrong manually.

**Example 1 — Saving a note mid-conversation:**
> "Save a note called 'project-ideas' with some ideas for my midterm project."

Claude immediately called `save_note` and generated relevant content based on the course context, without me needing to open a file, format markdown, or remember where to save it. This showed how MCP tools can make Claude feel like a true development assistant rather than just a chatbot.

**Example 2 — Setting up Git and pushing to GitHub:**
> "Push the folder inside week4... initialize a new repo and connect it to GitHub."

Claude walked through initializing the repo, creating a `.gitignore` to exclude `node_modules`, staging files, and pushing — handling the multi-step process in one go. It also flagged that the GitHub CLI wasn't installed and adapted by using `git` directly once I provided the repo URL.

**Example 3 — Changing the notes save path:**
> "How can I change the save location to C:\al928132\dig4503\week4\dev-notes-server?"

Claude read `index.js`, identified the exact line (`const NOTES_DIR = ...`), and made the targeted edit without touching anything else. It also reminded me to restart the MCP server for the change to take effect.

---

## 3. Debugging Journey

**Issue 1 — Notes saving to the wrong location:**
The biggest issue I ran into was that notes were being saved to `C:\Users\pajmn\dev-notes\` (the user's home directory) instead of my project folder. I only noticed this after saving a note and not finding it where I expected.

The fix was straightforward once I understood the code: the `NOTES_DIR` constant in `index.js` used `os.homedir()` to build the path. Changing it to a hardcoded absolute path pointed the server at the right directory. After updating the file, I had to restart the MCP server for the change to apply — without that restart, the server kept using the old path.

**Issue 2 — GitHub CLI not installed:**
When trying to create the GitHub repository automatically, the `gh` command wasn't found. Rather than blocking on installing it, I created the repository manually on GitHub and provided the URL directly, then used plain `git` commands to connect and push. This was a good reminder to have a fallback when tooling assumptions don't hold.

**Issue 3 — Bash path issues on Windows:**
The bash shell in Claude Code had trouble resolving paths like `~/dev-notes/` and Unix-style paths on Windows. Switching to `cmd //c` for directory operations and using Windows-style paths in git commands resolved this.

---

## 4. How MCP Works

MCP (Model Context Protocol) is a standard that lets AI models like Claude communicate with external tools and services through a defined interface.

At its core, MCP works like a plugin system. You write a **server** — a small program that exposes one or more **tools**. Each tool has a name, a description, and a schema defining what inputs it accepts. Claude reads these tool definitions and knows it can call them when a user's request matches.

When Claude decides to use a tool, it sends a **JSON-RPC request** to the server over stdin. The server runs the tool's logic, then sends a **JSON-RPC response** back over stdout. Claude receives the result and incorporates it into its reply. The whole exchange is structured and typed — Claude never just runs arbitrary code; it calls specific, defined functions.

In this project, the server runs locally as a Node.js process. Claude Code launches it in the background and keeps a persistent stdin/stdout connection open. Each time I asked Claude to save or read a note, it was making a structured function call to this server — not doing anything with files itself.

This architecture is powerful because it separates concerns cleanly: Claude handles language and reasoning, while the MCP server handles file I/O. The server can be swapped, extended, or replaced without changing how Claude interacts with it.

---

## 5. What I'd Do Differently

**Use an environment variable for the notes path:**
Hardcoding an absolute Windows path into `index.js` works for my machine but breaks for anyone else who clones the repo. A better approach would be to read the path from an environment variable (e.g., `NOTES_DIR`) with a sensible default fallback. That way the server is portable without code changes.

**Add a delete tool:**
Not being able to delete notes from within Claude is a noticeable gap. Adding a `delete_note` tool would make the server feel complete.

**Create the GitHub repo before starting:**
I had to pause mid-setup when I realized the GitHub CLI wasn't installed and the repo didn't exist yet. Having the remote repo ready before initializing the local one would have made the git setup smoother.

**Test the server independently first:**
Before integrating with Claude Code, it would have been worth testing the server directly using the MCP inspector or a simple JSON-RPC client. That would have caught path and permission issues earlier, without needing to trigger them through a conversation.
