// Quick test script that acts as an MCP client.
// Spawns the server and sends JSON-RPC messages over stdin/stdout.

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Launch the MCP server as a child process
const server = spawn("node", [path.join(__dirname, "index.js")], {
  stdio: ["pipe", "pipe", "pipe"],
});

let buffer = "";
let requestId = 1;

// Parse JSON-RPC responses from the server's stdout
server.stdout.on("data", (data) => {
  buffer += data.toString();
  // MCP messages are separated by newlines
  const lines = buffer.split("\n");
  buffer = lines.pop(); // keep incomplete line in buffer
  for (const line of lines) {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        console.log("\n<-- Response:", JSON.stringify(msg, null, 2));
      } catch {
        // skip non-JSON lines
      }
    }
  }
});

server.stderr.on("data", (data) => {
  console.error("SERVER STDERR:", data.toString());
});

// Send a JSON-RPC message to the server
function send(msg) {
  const json = JSON.stringify(msg);
  console.log("\n--> Sending:", JSON.stringify(msg, null, 2));
  server.stdin.write(json + "\n");
}

// Run the test sequence
async function runTests() {
  // Step 1: Initialize handshake
  console.log("=== Step 1: Initialize ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test-client", version: "1.0.0" },
    },
  });
  await sleep(1000);

  // Send initialized notification
  send({ jsonrpc: "2.0", method: "notifications/initialized" });
  await sleep(500);

  // Step 2: List tools to see what's available
  console.log("\n=== Step 2: List Tools ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "tools/list",
    params: {},
  });
  await sleep(1000);

  // Step 3: Test save_note
  console.log("\n=== Step 3: save_note ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "tools/call",
    params: {
      name: "save_note",
      arguments: {
        title: "Test Note",
        content: "# Test Note\n\nThis is a test note created by the MCP test script.",
      },
    },
  });
  await sleep(1000);

  // Step 4: Test list_notes
  console.log("\n=== Step 4: list_notes ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "tools/call",
    params: {
      name: "list_notes",
      arguments: {},
    },
  });
  await sleep(1000);

  // Step 5: Test read_note
  console.log("\n=== Step 5: read_note ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "tools/call",
    params: {
      name: "read_note",
      arguments: { title: "Test Note" },
    },
  });
  await sleep(1000);

  // Step 6: Test read_note with a non-existent note
  console.log("\n=== Step 6: read_note (not found) ===");
  send({
    jsonrpc: "2.0",
    id: requestId++,
    method: "tools/call",
    params: {
      name: "read_note",
      arguments: { title: "Does Not Exist" },
    },
  });
  await sleep(1000);

  console.log("\n=== Tests Complete ===");
  server.kill();
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

runTests();
