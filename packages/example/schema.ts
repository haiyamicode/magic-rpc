import * as h from "@haiyami/hyperstruct";
import type { RpcSchema, TypeRegistry } from "@magic-rpc/server";

// Domain schemas
export const UserSchema = h.defineType(
  "User",
  h.object({
    id: h.string(),
    name: h.string(),
    teamId: h.string(),
    createdAt: h.date(),
  })
);

export const TeamSchema = h.defineType(
  "Team",
  h.object({
    id: h.string(),
    name: h.string(),
    leaderId: h.string(),
    createdAt: h.date(),
  })
);

// RPC Schema
export const rpcSchema = {
  getUser: [h.object({ id: h.string() }), UserSchema],
  getUsers: [h.object({}), h.array(UserSchema)],
  getTeam: [h.object({ id: h.string() }), TeamSchema],
} satisfies RpcSchema;

// Inferred types
export type User = h.Infer<typeof UserSchema>;
export type Team = h.Infer<typeof TeamSchema>;

// Types registry
export const types = {
  User: UserSchema,
  Team: TeamSchema,
} satisfies TypeRegistry;

export type TypeId = keyof typeof types;
