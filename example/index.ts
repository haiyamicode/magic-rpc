import { RpcHandler } from '../src';
import * as h from '@haiyami/hyperstruct';
import DataLoader from 'dataloader';

// Simple domain types
interface User {
  id: string;
  name: string;
  teamId: string;
}

interface Team {
  id: string;
  name: string;
  leaderId: string;
}

// Mock data
const users = new Map<string, User>([
  ['1', { id: '1', name: 'Alice', teamId: 'team1' }],
  ['2', { id: '2', name: 'Bob', teamId: 'team1' }],
  ['3', { id: '3', name: 'Charlie', teamId: 'team2' }],
]);

const teams = new Map<string, Team>([
  ['team1', { id: 'team1', name: 'Engineering', leaderId: '1' }],
  ['team2', { id: 'team2', name: 'Design', leaderId: '3' }],
]);

// Schemas with proper names
const UserSchema = h.defineType('User', h.object({
  id: h.string(),
  name: h.string(),
  teamId: h.string(),
}));

const TeamSchema = h.defineType('Team', h.object({
  id: h.string(),
  name: h.string(),
  leaderId: h.string(),
}));

// RPC Methods
const schema = {
  getUser: [h.object({ id: h.string() }), UserSchema],
  getUsers: [h.object({}), h.array(UserSchema)],
};

// Types registry
const types = {
  User: UserSchema,
  Team: TeamSchema,
};

// DataLoaders for efficient batching
function createLoaders() {
  return {
    User: new DataLoader<string, User | null>(async (ids) => {
      console.log('🔍 Batching users:', Array.from(ids));
      return ids.map(id => users.get(id) || null);
    }),
    Team: new DataLoader<string, Team | null>(async (ids) => {
      console.log('🔍 Batching teams:', Array.from(ids));
      return ids.map(id => teams.get(id) || null);
    }),
  };
}

// Custom loaders for complex queries
function createCustomLoaders() {
  return {
    TeamMembers: new DataLoader<string, User[]>(async (teamIds) => {
      console.log('🔍 Loading members for teams:', Array.from(teamIds));
      return teamIds.map(teamId =>
        Array.from(users.values()).filter(user => user.teamId === teamId)
      );
    }),
  };
}

// Resolvers - GraphQL-like field resolution
const resolvers = {
  User: {
    team: {
      type: 'Team' as keyof typeof types,
      resolve: (user: User, context: { loaders: ReturnType<typeof createLoaders> & ReturnType<typeof createCustomLoaders> }) => {
        return context.loaders.Team.load(user.teamId);
      },
    },
  },
  Team: {
    leader: {
      type: 'User' as keyof typeof types,
      resolve: (team: Team, context: { loaders: ReturnType<typeof createLoaders> & ReturnType<typeof createCustomLoaders> }) => {
        return context.loaders.User.load(team.leaderId);
      },
    },
    members: {
      type: UserSchema,
      resolve: (team: Team, context: { loaders: ReturnType<typeof createLoaders> & ReturnType<typeof createCustomLoaders> }) => {
        return context.loaders.TeamMembers.load(team.id);
      },
    },
  },
};

// Method handlers
const handlers = {
  getUser: async ({ input }: { input: { id: string } }) => {
    const user = users.get(input.id);
    if (!user) throw new Error('User not found');
    return user;
  },
  
  getUsers: async () => {
    return Array.from(users.values());
  },
};

// Create RPC handler
const rpc = new RpcHandler({
  schema: schema as any,
  handlers,
  types: types as any,
  resolvers: resolvers as any,
  createLoaders,
  createCustomLoaders,
  maskOutput: false,
  validateOutput: false,
});

// Demo showing efficient DataLoader batching and GraphQL-like resolution
async function demo() {
  console.log('=== Simple RPC Call ===');
  const user = await rpc.handle({
    method: 'getUser',
    input: { id: '1' },
  }, {});
  console.log(user);
  
  console.log('\n=== Nested Resolution (GraphQL-like) ===');
  const userWithTeam = await rpc.handle({
    method: 'getUser', 
    input: { id: '1' },
    mappings: { team: 1 }, // Resolve team field
  }, {});
  console.log(userWithTeam);
  
  console.log('\n=== Deep Nesting + DataLoader Batching ===');
  const usersWithTeams = await rpc.handle({
    method: 'getUsers',
    input: {},
    mappings: {
      team: {       // Each user's team
        leader: 1,  // Team's leader
        members: 1, // All team members
      },
    },
  }, {});
  console.log(`Loaded ${usersWithTeams.length} users with efficient batching`);
}

if (require.main === module) {
  demo().catch(console.error);
}