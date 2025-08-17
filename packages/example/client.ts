import { createTypedClient, RpcClient } from "@magic-rpc/client";
import { rpcSchema } from "./schema";

const SERVER_URL = "http://localhost:3000/json-rpc";

async function demonstrateBasicClient() {
  console.log("=== Basic RPC Client Demo ===\n");

  const client = new RpcClient({
    baseUrl: SERVER_URL,
    timeout: 5000,
    schema: rpcSchema,
  });

  // Simple RPC call
  console.log("1. Simple RPC call:");
  try {
    const user = await client.call({
      method: "getUser",
      input: { id: "1" },
    });
    console.log("   Result:", user);
  } catch (error: unknown) {
    console.error("   Error:", error);
  }

  // RPC call with field mappings
  console.log("\n2. RPC call with nested field resolution:");
  try {
    const userWithTeam = await client.call({
      method: "getUser",
      input: { id: "1" },
      mappings: { team: 1 }, // Resolve team field
    });
    console.log("   Result:", JSON.stringify(userWithTeam, null, 2));
  } catch (error: unknown) {
    console.error("   Error:", error);
  }

  // Batch requests
  console.log("\n3. Batch requests:");
  try {
    const results = await client.batch([
      { method: "getUser", input: { id: "1" } },
      { method: "getUser", input: { id: "2" } },
      { method: "getTeam", input: { id: "team1" } },
    ]);
    console.log("   Results:", results);
  } catch (error: unknown) {
    console.error("   Error:", error);
  }
}

async function demonstrateTypedClient() {
  console.log("\n=== Typed RPC Client Demo ===\n");

  // Create type-safe client
  const client = createTypedClient(rpcSchema, {
    baseUrl: SERVER_URL,
    timeout: 5000,
  });

  // Type-safe method calls with IntelliSense
  console.log("1. Type-safe method call:");
  try {
    const user = await client.getUser({ id: "1" });
    console.log("   Result:", user);
  } catch (error: unknown) {
    console.error("   Error:", error);
  }

  // Type-safe with field mappings
  console.log("\n2. Type-safe call with field mappings:");
  try {
    const userWithTeam = await client.getUser(
      { id: "1" },
      { team: { leader: 1 } } // Deep nesting with type safety
    );
    console.log("   Result:", JSON.stringify(userWithTeam, null, 2));
  } catch (error: unknown) {
    console.error("   Error:", error);
  }

  // Multiple type-safe calls
  console.log("\n3. Multiple type-safe calls:");
  try {
    const [users, team] = await Promise.all([
      client.getUsers({}, { team: 1 }), // All users with their teams
      client.getTeam({ id: "team1" }, { leader: 1, members: 1 }), // Team with leader and members
    ]);

    console.log("   Users with teams:", JSON.stringify(users, null, 2));
    console.log("   Team with relations:", JSON.stringify(team, null, 2));
  } catch (error: unknown) {
    console.error("   Error:", error);
  }
}

async function demonstrateComplexQuery() {
  console.log("\n=== Complex Nested Query Demo ===\n");

  const client = createTypedClient(rpcSchema, { baseUrl: SERVER_URL });

  console.log("Complex query with deep nesting and efficient batching:");
  try {
    const users = await client.getUsers(
      {},
      {
        team: {
          // Each user's team
          leader: 1, // Team's leader
          members: {
            // All team members
            team: 1, // Each member's team (circular reference)
          },
        },
      }
    );

    console.log("Result:", JSON.stringify(users, null, 2));
    console.log(
      "\n✨ Notice how DataLoader efficiently batches all the database queries!"
    );
  } catch (error: unknown) {
    console.error("   Error:", error);
  }
}

async function main() {
  console.log("🎯 Magic RPC Client Examples\n");
  console.log("Make sure the server is running: yarn dev\n");

  try {
    // Test server connection
    const healthCheck = await fetch("http://localhost:3000/health");
    if (!healthCheck.ok) {
      throw new Error("Server not responding");
    }
    console.log("✅ Server is running!\n");

    // Run demos
    await demonstrateBasicClient();
    await demonstrateTypedClient();
    await demonstrateComplexQuery();

    console.log("\n🎉 All demos completed successfully!");
  } catch (error: unknown) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}
