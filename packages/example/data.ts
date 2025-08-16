import DataLoader from "dataloader";
import { Team, TypeId, User, UserSchema } from "./schema";

// Mock data
export const users = new Map<string, User>([
  ["1", { id: "1", name: "Alice", teamId: "team1" }],
  ["2", { id: "2", name: "Bob", teamId: "team1" }],
  ["3", { id: "3", name: "Charlie", teamId: "team2" }],
]);

export const teams = new Map<string, Team>([
  ["team1", { id: "team1", name: "Engineering", leaderId: "1" }],
  ["team2", { id: "team2", name: "Design", leaderId: "3" }],
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

// Resolvers - GraphQL-like field resolution
export const resolvers = {
  User: {
    team: {
      type: "Team" as TypeId,
      resolve: (
        user: User,
        context: {
          loaders: ReturnType<typeof createLoaders> &
            ReturnType<typeof createCustomLoaders>;
        }
      ) => {
        if (!user.teamId) return null;
        return context.loaders.Team.load(user.teamId);
      },
    },
  },
  Team: {
    leader: {
      type: "User" as TypeId,
      resolve: (
        team: Team,
        context: {
          loaders: ReturnType<typeof createLoaders> &
            ReturnType<typeof createCustomLoaders>;
        }
      ) => {
        if (!team.leaderId) return null;
        return context.loaders.User.load(team.leaderId);
      },
    },
    members: {
      type: UserSchema,
      resolve: (
        team: Team,
        context: {
          loaders: ReturnType<typeof createLoaders> &
            ReturnType<typeof createCustomLoaders>;
        }
      ) => {
        if (!team.id) return [];
        return context.loaders.TeamMembers.load(team.id);
      },
    },
  },
};

