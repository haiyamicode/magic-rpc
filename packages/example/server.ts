import cors from "@koa/cors";
import { RpcHandler } from "@magic-rpc/server";
import Koa from "koa";
import bodyParser from "koa-bodyparser";
import { createCustomLoaders, createLoaders, users } from "./data";
import { rpcSchema, types, UserSchema } from "./schema";

// Create RPC handler
const rpc = new RpcHandler({
  schema: rpcSchema,
  handlers: {
    getUser: async (params, context) => {
      const user = await context.loaders.User.load(params.input.id);
      if (!user) throw new Error("User not found");
      return user;
    },
    getUsers: async (_params, _context) => {
      return Array.from(users.values());
    },
    getTeam: async (params, context) => {
      const team = await context.loaders.Team.load(params.input.id);
      if (!team) throw new Error("Team not found");
      return team;
    },
  },
  types,
  resolvers: {
    User: {
      team: {
        type: "Team",
        resolve: (user, context) => {
          if (!user.teamId) return null;
          return context.loaders.Team.load(user.teamId);
        },
      },
    },
    Team: {
      leader: {
        type: "User",
        resolve: (team, context) => {
          if (!team.leaderId) return null;
          return context.loaders.User.load(team.leaderId);
        },
      },
      members: {
        type: UserSchema,
        resolve: (team, context) => {
          if (!team.id) return [];
          return context.loaders.TeamMembers.load(team.id);
        },
      },
    },
  },
  createLoaders,
  createCustomLoaders,
});

// Create Koa app
const app = new Koa();

app.use(cors());
app.use(bodyParser());

// RPC endpoint
app.use(async (ctx, next) => {
  if (ctx.path === "/json-rpc" && ctx.method === "POST") {
    try {
      // biome-ignore lint/suspicious/noExplicitAny: necessary
      const request = (ctx.request as any).body;

      // Handle single request
      if (!Array.isArray(request)) {
        const result = await rpc.handle(request, {});
        ctx.body = { result };
        return;
      }

      // Handle batch requests
      const results = await rpc.handleBatch(request, {});
      ctx.body = results.map((result) => ({ result }));
    } catch (error: unknown) {
      console.error("❌ RPC Error:", error);
      throw error; // Rethrow to see full stack trace
    }
  } else {
    await next();
  }
});

// Health check endpoint
app.use(async (ctx, next) => {
  if (ctx.path === "/health" && ctx.method === "GET") {
    ctx.body = { status: "ok", timestamp: new Date().toISOString() };
    return;
  }
  await next();
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Magic RPC Server running on http://localhost:${PORT}`);
  console.log(`📡 RPC endpoint: http://localhost:${PORT}/json-rpc`);
  console.log(`❤️  Health check: http://localhost:${PORT}/health`);
  console.log("\n🎯 Try running: yarn client\n");
});
