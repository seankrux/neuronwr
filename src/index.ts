import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const NEURON_BASE = "https://app.neuronwriter.com/neuron-api/0.5/writer";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name} env var`);
  return v;
}

export const configSchema = z.object({}).default({});

export default function createServer({ config }: { config: z.infer<typeof configSchema> }) {
  const server = new McpServer({
    name: "NeuronWriter MCP",
    version: "0.1.0"
  });

  server.registerTool(
    "nw.listProjects",
    {
      title: "List NeuronWriter projects",
      description: "Fetch projects from NeuronWriter",
      inputSchema: {}
    },
    async () => {
      const apiKey = requireEnv("NEURON_API_KEY");
      const resp = await fetch(`${NEURON_BASE}/list-projects`, {
        headers: { "X-API-KEY": apiKey }
      });
      if (!resp.ok) throw new Error(`NeuronWriter error ${resp.status}`);
      const json = await resp.json();
      return { content: [{ type: "json", json }] };
    }
  );

  server.registerTool(
    "nw.newQuery",
    {
      title: "Create a new NeuronWriter query",
      description: "Create a content writer query for a project",
      inputSchema: {
        type: "object",
        properties: {
          projectId: { type: "integer", description: "Project id" },
          keyword: { type: "string", description: "Keyword/topic" },
          engine: { type: "string", default: "google.com" },
          language: { type: "string", default: "English" }
        },
        required: ["projectId", "keyword"]
      }
    },
    async ({ projectId, keyword, engine = "google.com", language = "English" }) => {
      const apiKey = requireEnv("NEURON_API_KEY");
      const resp = await fetch(`${NEURON_BASE}/new-query`, {
        method: "POST",
        headers: {
          "X-API-KEY": apiKey,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          project: projectId,
          keyword,
          engine,
          language
        })
      });
      if (!resp.ok) throw new Error(`NeuronWriter error ${resp.status}`);
      const json = await resp.json();
      return { content: [{ type: "json", json }] };
    }
  );

  return server.server;
}
