import DataLoader from "dataloader";
import type { Team, User } from "./schema";

// Mock data
export const users = new Map<string, User>([
  [
    "1",
    {
      id: "1",
      name: "Alice",
      teamId: "team1",
      createdAt: new Date("2023-01-15T10:30:00Z"),
    },
  ],
  [
    "2",
    {
      id: "2",
      name: "Bob",
      teamId: "team1",
      createdAt: new Date("2023-02-20T14:45:00Z"),
    },
  ],
  [
    "3",
    {
      id: "3",
      name: "Charlie",
      teamId: "team2",
      createdAt: new Date("2023-03-10T09:15:00Z"),
    },
  ],
]);

export const teams = new Map<string, Team>([
  [
    "team1",
    {
      id: "team1",
      name: "Engineering",
      leaderId: "1",
      createdAt: new Date("2022-12-01T08:00:00Z"),
    },
  ],
  [
    "team2",
    {
      id: "team2",
      name: "Design",
      leaderId: "3",
      createdAt: new Date("2023-01-05T12:30:00Z"),
    },
  ],
]);

// DataLoaders for efficient batching
export function createLoaders() {
  return {
    User: new DataLoader<string, User | null>(async (ids) => {
      console.log("🔍 Batching users:", Array.from(ids));
      return ids.map((id) => users.get(id) || null);
    }),
    Team: new DataLoader<string, Team | null>(async (ids) => {
      console.log("🔍 Batching teams:", Array.from(ids));
      return ids.map((id) => teams.get(id) || null);
    }),
  };
}

// Custom loaders for complex queries
export function createCustomLoaders() {
  return {
    TeamMembers: new DataLoader<string, User[]>(async (teamIds) => {
      console.log("🔍 Loading members for teams:", Array.from(teamIds));
      return teamIds.map((teamId) =>
        Array.from(users.values()).filter((user) => user.teamId === teamId)
      );
    }),
  };
}
